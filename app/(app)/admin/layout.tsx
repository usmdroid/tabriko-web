import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLayoutClient } from "./AdminLayoutClient";
import { AdminIntlProvider } from "./AdminIntlProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale } from "@/lib/locale";

// Admin panel is a staff-only, auth-gated tool — it must never be indexed,
// and its canonical/alternates shouldn't point at the marketing homepage
// (the root layout's default alternates otherwise leak through here).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin", languages: { "x-default": "/admin" } },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Reading the cookie here (and only here) opts just the /admin segment
  // into dynamic rendering — it doesn't touch i18n/request.ts, so marketing
  // and creator routes stay statically generated. Admin is already
  // per-request (auth-gated), so this trade-off is free for it.
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const initialLocale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (
    <AdminIntlProvider initialLocale={initialLocale}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </AdminIntlProvider>
  );
}
