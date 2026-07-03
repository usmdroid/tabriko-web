import { getRequestConfig } from "next-intl/server";
import uzMessages from "@/locales/uz.json";

// Server-side locale is always "uz" (default). Client-side locale switching
// is handled by NextIntlClientProvider in providers.tsx via localStorage.
export default getRequestConfig(async () => ({
  locale: "uz",
  messages: uzMessages as Record<string, unknown>,
  timeZone: "Asia/Tashkent",
}));
