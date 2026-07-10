"use client";

import { useSyncExternalStore } from "react";
import { NextIntlClientProvider } from "next-intl";
import { allMessages } from "@/app/providers";
import { getCurrentLocale, subscribeLocale, type Locale } from "@/lib/locale";

// Admin's own layout (server component) reads the locale cookie directly —
// unlike i18n/request.ts, which stays cookie-free so marketing/creator pages
// keep static rendering — so this nested provider can start on the visitor's
// real saved locale instead of always flashing DEFAULT_LOCALE on first paint.
export function AdminIntlProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const locale = useSyncExternalStore(subscribeLocale, getCurrentLocale, () => initialLocale);

  return (
    <NextIntlClientProvider locale={locale} messages={allMessages[locale]} timeZone="Asia/Tashkent">
      {children}
    </NextIntlClientProvider>
  );
}
