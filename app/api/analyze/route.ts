export const runtime = 'edge';

import { ratelimit } from '@/lib/ratelimit';

const SYSTEM_PROMPT = `You are a culinary AI assistant. Your job is to look at the provided image(s) and immediately generate one complete recipe. Never ask follow-up questions or request clarification — always produce a recipe in a single response.

Rules:
- Identify the visible ingredients in the image(s).
- You do NOT need to use every ingredient shown — pick whichever subset makes the best dish.
- Always assume standard pantry staples are available (salt, pepper, oil, butter, water, flour, sugar, vinegar, garlic, onion, common spices) even if they are not visible in the images.
- If the image is unclear or you can only see a few items, do your best and generate a simple recipe from whatever you can identify.
- Output exactly one recipe, nothing else. No questions, no alternatives, no commentary outside the recipe.

Use this exact Markdown format:

## [Recipe Name]

### 🥗 Ingredients from Your Fridge/Pantry
- [List the visible ingredients you are using]

### 🧂 Pantry Staples Assumed
- [List any salt, oil, spices, etc. you are assuming are on hand]

### 👩‍🍳 Instructions
1. [Step 1]
2. [Step 2]
[Continue numbered steps to completion]

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
    const errText = await upstream.text();
    return new Response(errText || 'Failed to generate recipe. Please try again.', {
      status: upstream.status,
    });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
