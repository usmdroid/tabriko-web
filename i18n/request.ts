import { getRequestConfig } from "next-intl/server";
import uzMessages from "@/locales/uz.json";

// Server-side locale is always "uz" (default). Client-side locale switching
// is handled by NextIntlClientProvider in providers.tsx; the initial client
// render matches this "uz" default so hydration never mismatches, then a
// post-mount effect syncs to the visitor's saved locale (cookie/localStorage).
// Making this file read the locale from cookies() would force every route
// that calls getTranslations() (marketing Header/Footer, creator/apply) out
// of static generation and into per-request rendering — verified via a
// throwaway `npm run build` (marketing "/" flipped from "○ Static" to
// "ƒ Dynamic") — while admin, which never calls getTranslations() server-side,
// stayed static either way. Not worth the SEO/perf regression for zero gain.
export default getRequestConfig(async () => ({
  locale: "uz",
  messages: uzMessages as Record<string, unknown>,
  timeZone: "Asia/Tashkent",
}));
