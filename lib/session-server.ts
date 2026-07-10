// Server-only helpers shared by the /api/session/* BFF route handlers.
// Never import this from client components.

export type Scope = "admin" | "creator";

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ?? "https://tabriko-backend.onrender.com/api/v1"
)
  .trim()
  .replace(/\/+$/, "");

export const COOKIE_NAMES: Record<Scope, { at: string; rt: string }> = {
  admin: { at: "admin_at", rt: "admin_rt" },
  creator: { at: "creator_at", rt: "creator_rt" },
};

// Which backend user.role values are allowed to hold a session in each scope.
export const ALLOWED_ROLES: Record<Scope, string[]> = {
  admin: ["SUPERADMIN", "MODERATOR"],
  creator: ["CREATOR"],
};

export function isScope(v: unknown): v is Scope {
  return v === "admin" || v === "creator";
}

// Secure requires HTTPS; disabled outside production so local `next dev` over
// http keeps working.
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Refresh tokens are only ever read by /api/session/* routes, so scope the
// cookie there instead of sending it with every request.
export const refreshCookieOptions = {
  ...cookieOptions,
  path: "/api/session",
};

export function errorBody(code: string, text: string) {
  return { success: false, code, message: { code, text } };
}
