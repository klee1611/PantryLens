/**
 * @jest-environment node
 *
 * Tests for the Edge API route /api/analyze.
 * Verifies the opaque proxy contract: API key injection, system prompt hiding,
 * input validation, rate limiting, and streaming passthrough.
 */

// Self-contained factory — no closure over test-file variables avoids TDZ.
// We import `ratelimit` below to get a reference to the jest.fn() created here.
jest.mock('@/lib/ratelimit', () => ({
  ratelimit: { limit: jest.fn() },
}));

import { ratelimit } from '@/lib/ratelimit';
import { POST } from '@/app/api/analyze/route';

const makeRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/analyze', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });

const mockStream = () =>
  new ReadableStream({
    start(ctrl) {
      ctrl.enqueue(
        new TextEncoder().encode(
          'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n'
        )
      );
      ctrl.close();
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  process.env.OPENROUTER_API_KEY = 'test-api-key-secret';
  process.env.OPENROUTER_MODEL = 'google/gemma-4-26b-a4b-it';
  // Default: rate limit allows all requests through
  (ratelimit!.limit as jest.Mock).mockResolvedValue({ success: true });
});

// ── Input validation ──────────────────────────────────────────────────────────

describe('input validation', () => {
  it('returns 400 for missing images key', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty images array', async () => {
    const res = await POST(makeRequest({ images: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for more than 3 images', async () => {
    const res = await POST(makeRequest({ images: ['a', 'b', 'c', 'd'] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new Request('http://localhost/api/analyze', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts exactly 1 image', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockStream(), { status: 200 })
    );
    const res = await POST(makeRequest({ images: ['base64data'] }));
    expect(res.status).toBe(200);
  });

  it('accepts exactly 3 images', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockStream(), { status: 200 })
    );
    const res = await POST(makeRequest({ images: ['a', 'b', 'c'] }));
    expect(res.status).toBe(200);
  });
});

// ── Opaque proxy — security contract ─────────────────────────────────────────

describe('opaque proxy security', () => {
  it('injects Authorization header with API key', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockStream(), { status: 200 })
    );

    await POST(makeRequest({ images: ['base64'] }));

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer test-api-key-secret');
  });

  it('does NOT expose the API key in the response headers', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockStream(), { status: 200 })
    );

    const res = await POST(makeRequest({ images: ['base64'] }));

    expect(res.headers.get('Authorization')).toBeNull();
    // No header value should contain the key
    const allHeaderValues = [...res.headers.entries()].map(([, v]) => v).join(' ');
    expect(allHeaderValues).not.toContain('test-api-key-secret');
  });

  it('sends a system prompt that the frontend never sees', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockStream(), { status: 200 })
    );

    await POST(makeRequest({ images: ['base64'] }));

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    const systemMessage = body.messages.find((m: { role: string }) => m.role === 'system');
    expect(systemMessage).toBeDefined();
    expect(systemMessage.content).toContain('culinary');
  });

  it('calls the correct OpenRouter endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockStream(), { status: 200 })
    );

    await POST(makeRequest({ images: ['base64'] }));

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
  });

  it('sends stream: true to OpenRouter', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockStream(), { status: 200 })
    );

    await POST(makeRequest({ images: ['base64'] }));

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(options.body).stream).toBe(true);
  });
});

// ── Streaming passthrough ─────────────────────────────────────────────────────

describe('streaming passthrough', () => {
  it('returns text/event-stream content type', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockStream(), { status: 200 })
    );

    const res = await POST(makeRequest({ images: ['base64'] }));

    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
  });

  it('pipes images as image_url vision content blocks', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockStream(), { status: 200 })
    );

    await POST(makeRequest({ images: ['mybase64img'] }));

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const userMessage = JSON.parse(options.body).messages.find(
      (m: { role: string }) => m.role === 'user'
    );
    const imageBlock = userMessage.content.find(
      (c: { type: string }) => c.type === 'image_url'
    );
    expect(imageBlock.image_url.url).toBe('data:image/jpeg;base64,mybase64img');
  });
});

// ── Upstream error handling ───────────────────────────────────────────────────

describe('upstream error handling', () => {
  it('forwards upstream 429 status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response('Rate limited', { status: 429 })
    );

    const res = await POST(makeRequest({ images: ['base64'] }));
    expect(res.status).toBe(429);
  });

  it('returns 502 for upstream 500 errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response('Internal server error', { status: 500 })
    );

    const res = await POST(makeRequest({ images: ['base64'] }));
    expect(res.status).toBe(502);
  });
});

// ── Rate limiting ─────────────────────────────────────────────────────────────

describe('rate limiting', () => {
  it('returns 429 when the rate limit is exceeded', async () => {
    (ratelimit!.limit as jest.Mock).mockResolvedValueOnce({ success: false });

    const res = await POST(makeRequest({ images: ['base64'] }, { 'x-forwarded-for': '1.2.3.4' }));
    expect(res.status).toBe(429);
  });

  it('extracts the first IP from x-forwarded-for', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(mockStream(), { status: 200 })
    );

    await POST(makeRequest({ images: ['b'] }, { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }));
    expect(ratelimit!.limit as jest.Mock).toHaveBeenCalledWith('1.2.3.4');
  });
});
