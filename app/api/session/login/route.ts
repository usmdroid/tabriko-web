import { NextRequest, NextResponse } from "next/server";
import {
  API_BASE,
  ALLOWED_ROLES,
  COOKIE_NAMES,
  cookieOptions,
  refreshCookieOptions,
  errorBody,
  isScope,
} from "@/lib/session-server";

export async function POST(req: NextRequest) {
  let body: { phone?: string; password?: string; scope?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(errorBody("BAD_REQUEST", "Noto'g'ri so'rov."), { status: 400 });
  }

  const { phone, password, scope } = body;
  if (!phone || !password || !isScope(scope)) {
    return NextResponse.json(errorBody("BAD_REQUEST", "Noto'g'ri so'rov."), { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
  } catch {
    return NextResponse.json(errorBody("NETWORK_ERROR", "Tarmoq xatosi. Internet aloqasini tekshiring."), {
      status: 502,
    });
  }

  const json = await upstream.json().catch(() => null);

  if (!upstream.ok || !json?.data?.accessToken) {
    return NextResponse.json(json ?? errorBody("UNKNOWN", "Xatolik yuz berdi."), { status: upstream.status });
  }

  const { accessToken, refreshToken, user } = json.data;
  if (!ALLOWED_ROLES[scope].includes(user?.role)) {
    return NextResponse.json(errorBody("FORBIDDEN", "Kirish huquqingiz yo'q."), { status: 403 });
  }

  const names = COOKIE_NAMES[scope];
  const res = NextResponse.json({
    success: true,
    data: { name: user.name ?? user.phone, role: user.role },
  });
  res.cookies.set(names.at, accessToken, cookieOptions);
  res.cookies.set(names.rt, refreshToken, refreshCookieOptions);
  return res;
}
