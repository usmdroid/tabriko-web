// Shared locale constants — importable from both client and server code
// (unlike lib/session-server.ts, nothing here is server-only).

export const LOCALES = ["uz", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";

export const LOCALE_COOKIE_NAME = "tabriko-locale";
export const LOCALE_STORAGE_KEY = "tabriko-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export const INTL_LOCALE_TAG: Record<Locale, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
};

const LOCALE_CHANGE_EVENT = "tabriko:locale-change";

export function dispatchLocaleChange() {
  window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
}

// Client-only: subscribes to both same-tab (`setLocale`) and cross-tab
// (`storage`) locale changes. Shared by every NextIntlClientProvider in the
// tree (root + any segment-scoped override, e.g. admin's) so they all
// reconcile to the same visitor-saved locale.
export function subscribeLocale(callback: () => void) {
  window.addEventListener(LOCALE_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Client-only: the visitor's saved locale (cookie, falling back to
// localStorage), or DEFAULT_LOCALE on the server / when nothing is saved yet.
export function getCurrentLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const fromCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${LOCALE_COOKIE_NAME}=`))
      ?.split("=")[1];
    if (isLocale(fromCookie)) return fromCookie;
  } catch {
    // ignore
  }
  try {
    const fromStorage = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(fromStorage)) return fromStorage;
  } catch {
    // ignore (private mode)
  }
  return DEFAULT_LOCALE;
}
