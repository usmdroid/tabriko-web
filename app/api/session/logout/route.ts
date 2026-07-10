import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES, cookieOptions, refreshCookieOptions, errorBody, isScope } from "@/lib/session-server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const scope = body?.scope;

  if (!isScope(scope)) {
    return NextResponse.json(errorBody("BAD_REQUEST", "Noto'g'ri so'rov."), { status: 400 });
  }

  const names = COOKIE_NAMES[scope];
  const res = NextResponse.json({ success: true });
  res.cookies.set(names.at, "", { ...cookieOptions, maxAge: 0 });
  res.cookies.set(names.rt, "", { ...refreshCookieOptions, maxAge: 0 });
  return res;
}
