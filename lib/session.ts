// Shared session-info storage for admin and creator panels.
//
// This stores ONLY { name, role } — never the JWT. Access/refresh tokens live
// exclusively in HttpOnly cookies set by the /api/session/* route handlers and
// are never readable from client JS. This localStorage entry is just display
// state for the sidebar; losing it (private mode, manual clear) forces a
// re-login even though the HttpOnly cookie may still be valid — an acceptable
// tradeoff since the cookie can't be introspected from the client.

export type Scope = "admin" | "creator";

export interface SessionInfo {
  name: string;
  role: string;
}

const STORAGE_KEY: Record<Scope, string> = {
  admin: "admin_session",
  creator: "creator_session",
};

export function getSession(scope: Scope): SessionInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY[scope]);
    return raw ? (JSON.parse(raw) as SessionInfo) : null;
  } catch {
    return null;
  }
}

export function saveSession(scope: Scope, info: SessionInfo): void {
  localStorage.setItem(STORAGE_KEY[scope], JSON.stringify(info));
}

// Clears the local display state and asks the server to drop the HttpOnly
// cookies (client JS cannot delete HttpOnly cookies itself).
export async function clearSession(scope: Scope): Promise<void> {
  localStorage.removeItem(STORAGE_KEY[scope]);
  try {
    await fetch("/api/session/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    });
  } catch {
    // Best-effort: if this fails the cookies expire on their own via refresh failure.
  }
}
