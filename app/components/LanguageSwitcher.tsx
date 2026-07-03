"use client";

import { useLocaleCtx, type Locale } from "@/app/providers";
import { useTranslations } from "next-intl";

const LOCALES: { value: Locale; flag: string; code: string }[] = [
  { value: "uz", flag: "🇺🇿", code: "UZ" },
  { value: "ru", flag: "🇷🇺", code: "RU" },
  { value: "en", flag: "🇬🇧", code: "EN" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleCtx();
  const t = useTranslations("lang");

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-line bg-bg p-0.5">
      {LOCALES.map(({ value, flag, code }) => (
        <button
          key={value}
          onClick={() => setLocale(value)}
          title={t(value)}
          aria-label={t(value)}
          className={`flex h-7 items-center justify-center rounded-md px-1.5 text-xs font-medium transition-colors ${
            locale === value
              ? "bg-surface text-primary shadow-sm"
              : "text-muted hover:text-primary"
          }`}
        >
          <span className="mr-0.5">{flag}</span>
          {code}
        </button>
      ))}
    </div>
  );
}
