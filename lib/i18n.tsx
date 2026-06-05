'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import en from '@/messages/en.json';
import zhTW from '@/messages/zh-TW.json';
import ja from '@/messages/ja.json';
import fr from '@/messages/fr.json';

export const LOCALES = ['en', 'zh-TW', 'ja', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  'zh-TW': '繁中',
  ja: '日本語',
  fr: 'FR',
};

const messages: Record<Locale, typeof en> = { en, 'zh-TW': zhTW, ja, fr };

export type Messages = typeof en;

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Messages;
}>({ locale: 'en', setLocale: () => {}, t: en });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem('locale') as Locale | null;
    if (stored && (LOCALES as readonly string[]).includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    localStorage.setItem('locale', l);
    setLocaleState(l);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: messages[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);

/** Replace {key} placeholders in a translation string. */
export function interpolate(str: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    str,
  );
}
