"use client";

import React, { useState, createContext, useContext } from "react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import uzMessages from "@/locales/uz.json";
import ruMessages from "@/locales/ru.json";
import enMessages from "@/locales/en.json";

export type Locale = "uz" | "ru" | "en";

const allMessages: Record<Locale, Record<string, unknown>> = {
  uz: uzMessages as Record<string, unknown>,
  ru: ruMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
};

interface LocaleCtxType {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleCtx = createContext<LocaleCtxType>({ locale: "uz", setLocale: () => {} });
export const useLocaleCtx = () => useContext(LocaleCtx);

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "uz";
    const s = localStorage.getItem("tabriko-locale");
    return s && s in allMessages ? (s as Locale) : "uz";
  });

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("tabriko-locale", l);
  }

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
