import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "@/lib/session-server";

// Edge gate: only checks that the HttpOnly access-token cookie is present.
// Actual JWT validity is enforced by the backend on every proxied call.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!req.cookies.get(COOKIE_NAMES.admin.at)?.value) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  if (pathname.startsWith("/creator")) {
    if (pathname === "/creator/login") return NextResponse.next();
    if (!req.cookies.get(COOKIE_NAMES.creator.at)?.value) {
      return NextResponse.redirect(new URL("/creator/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/creator/:path*"],
};
