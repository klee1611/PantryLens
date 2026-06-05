'use client';

import { LOCALES, LOCALE_LABELS, useLocale, type Locale } from '@/lib/i18n';

export default function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="fixed top-3 right-3 z-50 flex gap-1 bg-white/90 backdrop-blur border border-stone-200 rounded-full px-2 py-1 shadow-sm"
      role="group"
      aria-label="Language selector"
    >
      {LOCALES.map((l: Locale) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={[
            'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
            locale === l
              ? 'bg-amber-500 text-white'
              : 'text-stone-500 hover:text-amber-700',
          ].join(' ')}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
