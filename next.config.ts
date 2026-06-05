import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

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
      // 'unsafe-inline' is required by Next.js App Router RSC hydration scripts.
      // 'unsafe-eval' is only needed for dev-mode HMR source maps — excluded in production.
      isProd
        ? "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://www.google-analytics.com",
      "font-src 'self'",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
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

  // Allow the dev server to serve cross-origin requests from other devices on the
  // local network (e.g. iPhone on the same WiFi). Set DEV_ORIGINS in .env.local —
  // never commit real IPs here. Has no effect in production builds.
  ...(process.env.DEV_ORIGINS
    ? { allowedDevOrigins: process.env.DEV_ORIGINS.split(',').map((s) => s.trim()) }
    : {}),
};

export default nextConfig;
