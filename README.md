# PantryLens

> Snap a photo of your fridge or pantry — get a recipe in seconds.

PantryLens is a progressive web app (PWA) that uses AI vision to identify ingredients from photos and stream a complete recipe directly to the screen, token by token.

---

## How it works

1. **Capture** — take a photo with your camera, upload from your gallery, or drag and drop (up to 3 images)
2. **Compress** — the browser Canvas API resizes each image client-side to ≤1024 px before upload
3. **Analyze** — a Next.js Edge Function proxies the images to OpenRouter's vision model
4. **Stream** — the recipe streams back token-by-token, rendered progressively as Markdown

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Edge Runtime) |
| UI | React 19, Tailwind CSS, react-markdown |
| AI | OpenRouter — `google/gemma-4-26b-a4b-it` |
| Rate limiting | Upstash Redis (sliding window, 5 req/IP/hour) |
| Testing | Jest 29, Testing Library, Playwright |
| Deploy | Vercel |

---

## Getting started

### Prerequisites

- Node.js 20+
- An [OpenRouter](https://openrouter.ai) API key
- An [Upstash Redis](https://upstash.com) database (free tier works)

### Install

```bash
git clone https://github.com/YOUR_USERNAME/pantrylens.git
cd pantrylens
npm install
```

### Configure environment

Copy the example below into `.env.local`:

```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemma-4-26b-a4b-it

UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Rate limiting is optional in development.** If `UPSTASH_REDIS_REST_URL` is not set (or doesn't start with `https://`), the rate limiter is silently disabled.

### Run

```bash
npm run dev      # development server at http://localhost:3000
npm run build    # production build
npm start        # serve production build
```

---

## Architecture

```
Browser
  └─ Canvas API          compress image → ≤1024px JPEG @ 75% quality
  └─ POST /api/analyze   { images: string[] }  ← Base64 array, no API key

Edge Function (Vercel)
  └─ IP rate limit       Upstash Redis sliding window
  └─ Payload size check  4 MB body / 2 MB per image hard caps
  └─ Inject secrets      Authorization header + system prompt (server-only)
  └─ fetch() OpenRouter  stream: true
  └─ Pipe SSE stream     text/event-stream → browser

Browser
  └─ ReadableStream      decode SSE chunks
  └─ react-markdown      render Markdown progressively
```

The API route is an **opaque proxy** — the frontend never sees the API key or the system prompt. Both are injected exclusively inside the Edge Function.

---

## Security

| Control | Implementation |
|---------|---------------|
| API key protection | Injected server-side only; absent from all JS bundles |
| System prompt hiding | Server-side only; not visible in network traffic |
| Rate limiting | 5 requests / IP / hour via Upstash Redis |
| Payload size cap | 413 if body > 4 MB or any single image > 2 MB |
| HTTP security headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP — all set in `next.config.ts` |
| Framework fingerprint | `X-Powered-By` header removed |

---

## Testing

```bash
npm test                # run all unit tests (69 tests)
npm run test:coverage   # with coverage report
npm run test:watch      # watch mode
```

### Test coverage

| Suite | Tests | What's covered |
|-------|-------|----------------|
| `__tests__/api/analyze.test.ts` | 17 | Input validation, opaque proxy security, streaming passthrough, rate limiting |
| `__tests__/components/PantryLensApp.test.tsx` | 13 | Full interaction flow, streaming, error states |
| `__tests__/components/ImageCapture.test.tsx` | 8 | Drop zone, file/camera inputs, disabled states |
| `__tests__/components/ImagePreview.test.tsx` | 6 | Thumbnails, remove callback, empty state |
| `__tests__/components/RecipeStream.test.tsx` | 9 | Loading, streaming, done, and idle states |
| `__tests__/lib/canvasCompress.test.ts` | 16 | Resize logic, Base64 output, error handling |

---

## Deployment

### Vercel (recommended)

```bash
npx vercel --prod
```

Set the same environment variables from `.env.local` in the Vercel project settings. The Edge Runtime and streaming work out of the box.

### Environment variables required in production

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter secret key |
| `OPENROUTER_MODEL` | Model ID (default: `google/gemma-4-26b-a4b-it`) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `NEXT_PUBLIC_APP_URL` | Canonical URL of your deployment |

---

## PWA

PantryLens is installable as a home screen app on iOS and Android. The manifest is at `public/manifest.json` and a minimal service worker ships at `public/sw.js`. The `/api/*` routes are excluded from the service worker cache.

---

## Project structure

```
├── app/
│   ├── api/analyze/route.ts   # Edge Runtime proxy (core)
│   ├── layout.tsx             # Root layout, metadata, PWA tags
│   └── page.tsx               # Server component + JSON-LD schema
├── components/
│   ├── PantryLensApp.tsx      # Main client component + SSE consumer
│   ├── ImageCapture.tsx       # Camera / file / drag-drop input
│   ├── ImagePreview.tsx       # Thumbnail strip
│   └── RecipeStream.tsx       # Streaming Markdown display
├── lib/
│   ├── canvasCompress.ts      # Client-side Canvas compression
│   └── ratelimit.ts           # Upstash rate limiter
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── robots.txt             # Disallows /api/
│   └── llms.txt               # AI search readiness signal
└── __tests__/                 # Jest test suites
```

---

## License

MIT
