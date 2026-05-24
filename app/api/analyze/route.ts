export const runtime = 'edge';

import { ratelimit } from '@/lib/ratelimit';

const SYSTEM_PROMPT = `You are a culinary AI assistant. Look at the provided image(s) and output ONE complete recipe immediately. Never ask questions — always produce the full recipe in a single response.

Rules:
- Identify visible ingredients. You do NOT need to use all of them — pick the best subset.
- Standard pantry staples (salt, pepper, oil, butter, garlic, onion, flour, sugar, vinegar, common spices) are always available even if not visible.
- If the image is unclear, do your best with whatever you can identify.
- Output ONLY the recipe. No questions, no commentary, no alternatives.

FORMATTING RULES — follow exactly:
- The recipe title uses ## (two hashes). It must be alone on its own line.
- Each section header uses ### (three hashes). It must be alone on its own line.
- Every heading must have one blank line before it AND one blank line after it.
- The ingredients and staples sections are bullet lists (lines starting with -).
- The instructions section is a numbered list (lines starting with 1. 2. 3. etc.). Each step is on its own line. Never merge steps into a paragraph.
- Do not put a heading and a list item on the same line.

Output this structure, replacing the placeholders with real content:

## [Recipe Name]

### 🥗 Ingredients from Your Fridge/Pantry
- [ingredient]
- [ingredient]

### 🧂 Pantry Staples Assumed
- [staple]
- [staple]

### 👩‍🍳 Instructions
1. [First step.]
2. [Second step.]
3. [Continue until complete.]

### ⏱️ Time & Servings
- **Prep time:** [X minutes]
- **Cook time:** [X minutes]
- **Serves:** [X people]`;

// 4 MB is generous for 3 × Canvas-compressed images (~200 KB each after Base64 overhead)
const MAX_BODY_BYTES = 4 * 1024 * 1024;
// Per-image Base64 length cap (~1.5 MB decoded ≈ 2 MB Base64)
const MAX_IMAGE_B64_LENGTH = 2 * 1024 * 1024;

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();

  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new Response(
        "You've reached the hourly limit (5 requests/hour). Please try again later.",
        { status: 429 }
      );
    }
  }

  // Reject oversized bodies before parsing JSON to avoid DoS via huge payloads
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return new Response('Request body too large.', { status: 413 });
  }

  let body: { images: string[] };
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new Response('Request body too large.', { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return new Response('Invalid request body.', { status: 400 });
  }

  const { images } = body;
  if (!Array.isArray(images) || images.length === 0 || images.length > 3) {
    return new Response('Please provide between 1 and 3 images.', { status: 400 });
  }

  // Validate each image string doesn't exceed the per-image cap
  if (images.some((img) => typeof img !== 'string' || img.length > MAX_IMAGE_B64_LENGTH)) {
    return new Response('One or more images exceed the size limit.', { status: 413 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userContent: any[] = [
    { type: 'text', text: 'Please analyze these ingredient images and generate a recipe.' },
    ...images.map((b64) => ({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}` },
    })),
  ];

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://pantrylens.app',
      'X-Title': 'PantryLens',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? 'google/gemma-4-26b-a4b-it',
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!upstream.ok) {
    await upstream.body?.cancel();
    const status = upstream.status;
    const userMessage =
      status === 429
        ? "You've reached the hourly limit (5 requests/hour). Please try again later."
        : status >= 500
          ? 'The AI service is temporarily unavailable. Please try again in a moment.'
          : 'Failed to generate recipe. Please try again.';
    return new Response(userMessage, { status });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
