export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

type GaEvent =
  | { name: 'recipe_generated'; params: { locale: string } }
  | { name: 'recipe_error'; params: { error_type: 'rate_limit' | 'upstream' | 'photo' | 'generic' } }
  | { name: 'image_added'; params: { count: number } }
  | { name: 'locale_changed'; params: { locale: string } }
  | { name: 'pwa_banner_dismissed'; params?: Record<string, never> };

export function trackEvent(event: GaEvent) {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return;
  window.gtag('event', event.name, event.params ?? {});
}
