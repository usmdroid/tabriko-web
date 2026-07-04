import * as Sentry from "@sentry/nextjs";

// Default points to the Render test backend (api.tabriko.uz is not live yet).
// Override per-environment via NEXT_PUBLIC_API_BASE (baked at build time).
// Whitespace and trailing slashes are stripped so an env value like
// ".../api/v1/" or ".../api/v1 " (trailing space) doesn't produce a broken
// path (".../api/v1//auth/..." or ".../api/v1%20/auth/...") that 401s.
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ?? "https://tabriko-backend.onrender.com/api/v1"
).trim().replace(/\/+$/, "");

export interface ApiMessage {
  code: string;
  text: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  httpStatus: number;
  code: string;
  message: ApiMessage;
  data: T;
}

export class ApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<ApiResponse<T>> {
  const { token, ...rest } = init ?? {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  } catch (err) {
    Sentry.captureException(err);
    throw new ApiError(0, "NETWORK_ERROR", "Tarmoq xatosi. Internet aloqasini tekshiring.");
  }

  const json: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    httpStatus: res.status,
    code: "PARSE_ERROR",
    message: { code: "PARSE_ERROR", text: "Javob o'qib bo'lmadi." },
    data: null as T,
  }));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.code ?? "UNKNOWN",
      json.message?.text ?? "Xatolik yuz berdi.",
    );
  }

  return json;
}

export function get<T>(path: string, token?: string) {
  return request<T>(path, { method: "GET", token });
}

export function post<T>(path: string, body: unknown, token?: string) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body), token });
}

export function patch<T>(path: string, body: unknown, token?: string) {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body), token });
}
