"use client";

import React, { useCallback, useSyncExternalStore, createContext, useContext } from "react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import uzMessages from "@/locales/uz.json";
import ruMessages from "@/locales/ru.json";
import enMessages from "@/locales/en.json";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  dispatchLocaleChange,
  getCurrentLocale,
  subscribeLocale,
  type Locale,
} from "@/lib/locale";

export type { Locale };

// Exported so segment-scoped overrides (e.g. admin's AdminIntlProvider) can
// render the same message sets without re-importing the JSON themselves.
export const allMessages: Record<Locale, Record<string, unknown>> = {
  uz: uzMessages as Record<string, unknown>,
  ru: ruMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
};

interface LocaleCtxType {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleCtx = createContext<LocaleCtxType>({ locale: DEFAULT_LOCALE, setLocale: () => {} });
export const useLocaleCtx = () => useContext(LocaleCtx);

export function Providers({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore keeps SSR + the first client render on DEFAULT_LOCALE
  // (getServerSnapshot), so hydration never mismatches, then reconciles to the
  // visitor's saved locale (getSnapshot) once hydrated.
  const locale = useSyncExternalStore(subscribeLocale, getCurrentLocale, () => DEFAULT_LOCALE);

  const setLocale = useCallback((l: Locale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l);
      document.cookie = `${LOCALE_COOKIE_NAME}=${l}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore (private mode)
    }
    dispatchLocaleChange();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="tabriko-theme">
      <LocaleCtx.Provider value={{ locale, setLocale }}>
        <NextIntlClientProvider locale={locale} messages={allMessages[locale]} timeZone="Asia/Tashkent">
          {children}
        </NextIntlClientProvider>
      </LocaleCtx.Provider>
    </ThemeProvider>
  );
}
