import { NextRequest, NextResponse } from "next/server";
import { API_BASE, COOKIE_NAMES, cookieOptions, refreshCookieOptions, errorBody, isScope } from "@/lib/session-server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const scope = body?.scope;

  if (!isScope(scope)) {
    return NextResponse.json(errorBody("BAD_REQUEST", "Noto'g'ri so'rov."), { status: 400 });
  }

  const names = COOKIE_NAMES[scope];
  const refreshToken = req.cookies.get(names.rt)?.value;

  if (!refreshToken) {
    return NextResponse.json(errorBody("NO_REFRESH_TOKEN", "Sessiya topilmadi."), { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return NextResponse.json(errorBody("NETWORK_ERROR", "Tarmoq xatosi. Internet aloqasini tekshiring."), {
      status: 502,
    });
  }

  const json = await upstream.json().catch(() => null);

  if (!upstream.ok || !json?.data?.accessToken) {
    // Refresh token is invalid/expired — clear cookies so the client cleanly logs out.
    const res = NextResponse.json(json ?? errorBody("UNAUTHORIZED", "Sessiya tugagan."), {
      status: upstream.status || 401,
    });
    res.cookies.set(names.at, "", { ...cookieOptions, maxAge: 0 });
    res.cookies.set(names.rt, "", { ...refreshCookieOptions, maxAge: 0 });
    return res;
  }

  const { accessToken, refreshToken: newRefreshToken } = json.data;
  const res = NextResponse.json({ success: true });
  res.cookies.set(names.at, accessToken, cookieOptions);
  res.cookies.set(names.rt, newRefreshToken, refreshCookieOptions);
  return res;
}
