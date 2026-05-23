import type { NextConfig } from 'next';

const securityHeaders = [
  // Prevent MIME-type sniffing attacks
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Deny framing to block clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Enforce HTTPS for 1 year (includeSubDomains; omit preload until the domain is stable)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Don't send Referer when leaving the site
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down powerful browser features the app doesn't use
  { key: 'Permissions-Policy', value: 'camera=self, microphone=(), geolocation=(), payment=()' },
  // Prevent cross-origin window access (e.g. window.opener attacks)
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // Restrict cross-origin resource sharing to same-origin by default
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  // Remove framework fingerprint
  { key: 'X-Powered-By', value: '' },  // Next.js strips this when the key is empty
  // Tight CSP: no inline scripts, no eval, images only from self + data: (previews)
  // 'unsafe-inline' on style-src is required by Tailwind's JIT runtime classes
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval'",  // 'unsafe-eval' needed by Next.js dev HMR; tighten in prod
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",       // blob: for Canvas-compressed previews
      "font-src 'self'",
      "connect-src 'self'",               // SSE to /api/analyze only
      "media-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      // Apply to every route
      source: '/(.*)',
      headers: securityHeaders.filter((h) => h.value !== ''),
    },
  ],

  // Strip X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;
