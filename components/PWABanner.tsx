'use client';

import { useEffect, useState } from 'react';

export default function PWABanner() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('pwa-banner-dismissed') === '1';
    if (!alreadyInstalled && !dismissed) setVisible(true);

    // iOS Safari doesn't fire beforeinstallprompt — detect it to show different copy
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window));
  }, []);

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm"
    >
      <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true">📲</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-800 leading-snug">Install PantryLens on your device</p>
        <p className="text-amber-700 mt-0.5 leading-snug">
          {isIOS
            ? 'Tap the Share button ↑ then "Add to Home Screen" for quick access.'
            : 'Tap the browser menu (⋮) then "Add to Home screen" for quick access.'}
        </p>
      </div>
      <button
        onClick={() => {
          localStorage.setItem('pwa-banner-dismissed', '1');
          setVisible(false);
        }}
        aria-label="Dismiss install banner"
        className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors text-lg leading-none mt-0.5"
      >
        ✕
      </button>
    </div>
  );
}
