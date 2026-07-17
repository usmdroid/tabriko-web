import { ApiError, ApiResponse } from "./api";

// Unified auth-aware fetch layer for admin/creator panels.
//
// Every authenticated backend call goes through the same-origin BFF proxy
// (app/api/proxy/[scope]/[...path]), which reads the HttpOnly access-token
// cookie server-side and forwards it as `Authorization: Bearer`. Client JS
// never sees the token.
//
// On a 401 we run one silent refresh (deduped per scope so concurrent 401s
// share a single in-flight refresh) and retry the original request once. If
// the refresh also fails, we dispatch `${scope}:401` so the layout logs out.

export type Scope = "admin" | "creator";

const refreshPromises: Partial<Record<Scope, Promise<boolean>>> = {};

function refresh(scope: Scope): Promise<boolean> {
  if (!refreshPromises[scope]) {
    refreshPromises[scope] = fetch("/api/session/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        delete refreshPromises[scope];
      });
  }
  return refreshPromises[scope]!;
}

function dispatchLogout(scope: Scope) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(`${scope}:401`));
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

// Human-readable message for a response whose body we couldn't parse as JSON.
// This happens for empty bodies and for gateway/HTML error pages (e.g. a 502/504
// while the backend is cold-starting) — never surface the raw "can't parse".
function statusMessage(status: number): string {
  if (status === 0) return "Server bilan bog'lanib bo'lmadi. Internet aloqasini tekshiring.";
  if (status === 502 || status === 503 || status === 504)
    return "Server hozircha javob bermayapti. Bir necha soniyadan so'ng qayta urinib ko'ring.";
  if (status >= 500) return "Serverda xatolik yuz berdi. Bir necha soniyadan so'ng qayta urinib ko'ring.";
  if (status === 413) return "Yuborilayotgan ma'lumot hajmi juda katta.";
  if (status >= 400) return "So'rov bajarilmadi. Ma'lumotlarni tekshirib qayta urinib ko'ring.";
  return "Kutilmagan xatolik yuz berdi.";
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const text = await res.text().catch(() => "");
  // Empty body (e.g. 200/204 with no content) is a valid success — don't turn
  // it into a parse error the way JSON.parse("") would.
  if (!text.trim()) {
    const code = res.ok ? "OK" : `HTTP_${res.status}`;
    return {
      success: res.ok,
      httpStatus: res.status,
      code,
      message: { code, text: res.ok ? "OK" : statusMessage(res.status) },
      data: null as T,
    };
  }
  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    // Non-JSON body (HTML error page from a gateway, etc.).
    const code = `HTTP_${res.status}`;
    return {
      success: false,
      httpStatus: res.status,
      code,
      message: { code, text: statusMessage(res.status) },
      data: null as T,
    };
  }
}

async function authRequest<T>(
  scope: Scope,
  path: string,
  init: RequestInit & { jsonBody?: boolean } = {},
): Promise<ApiResponse<T>> {
  const { jsonBody = true, signal, ...rest } = init;
  const headers: Record<string, string> = {
    ...(jsonBody ? { "Content-Type": "application/json" } : {}),
  };

  const doFetch = async () => {
    try {
      return await fetch(`/api/proxy/${scope}${path}`, { ...rest, headers, signal });
    } catch (err) {
      if (isAbortError(err)) throw err;
      throw new ApiError(0, "NETWORK_ERROR", "Tarmoq xatosi. Internet aloqasini tekshiring.");
    }
  };

  let res = await doFetch();

  if (res.status === 401) {
    const refreshed = await refresh(scope);
    if (refreshed) {
      res = await doFetch();
    }
    if (!refreshed || res.status === 401) {
      dispatchLogout(scope);
      const json = await parseResponse<T>(res);
      throw new ApiError(401, json.code ?? "UNAUTHORIZED", json.message?.text ?? "Sessiya tugagan.");
    }
  }

  const json = await parseResponse<T>(res);

  if (!res.ok) {
    throw new ApiError(res.status, json.code ?? "UNKNOWN", json.message?.text ?? "Xatolik yuz berdi.");
  }

  return json;
}

export function authGet<T>(scope: Scope, path: string, signal?: AbortSignal) {
  return authRequest<T>(scope, path, { method: "GET", signal });
}

export function authPost<T>(scope: Scope, path: string, body?: unknown, signal?: AbortSignal) {
  return authRequest<T>(scope, path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
}

export function authPut<T>(scope: Scope, path: string, body?: unknown, signal?: AbortSignal) {
  return authRequest<T>(scope, path, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
}

export function authPatch<T>(scope: Scope, path: string, body?: unknown, signal?: AbortSignal) {
  return authRequest<T>(scope, path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
}

export function authDel<T>(scope: Scope, path: string, signal?: AbortSignal) {
  return authRequest<T>(scope, path, { method: "DELETE", signal });
}

export function authDelWithBody<T>(scope: Scope, path: string, body?: unknown, signal?: AbortSignal) {
  return authRequest<T>(scope, path, {
    method: "DELETE",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
}

export function authPostForm<T>(scope: Scope, path: string, formData: FormData, signal?: AbortSignal) {
  return authRequest<T>(scope, path, { method: "POST", body: formData, jsonBody: false, signal });
}
