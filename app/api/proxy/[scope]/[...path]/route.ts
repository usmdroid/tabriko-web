import { NextRequest, NextResponse } from "next/server";
import { API_BASE, COOKIE_NAMES, errorBody, isScope } from "@/lib/session-server";

// Forwards authenticated calls from the browser to the backend, attaching the
// Authorization header from the HttpOnly access-token cookie server-side.
// Client JS never sees the token — see lib/auth-fetch.ts for the caller side.
async function handle(req: NextRequest, ctx: { params: Promise<{ scope: string; path: string[] }> }) {
  const { scope, path } = await ctx.params;

  if (!isScope(scope)) {
    return NextResponse.json(errorBody("BAD_REQUEST", "Noto'g'ri so'rov."), { status: 400 });
  }

  const token = req.cookies.get(COOKIE_NAMES[scope].at)?.value;
  if (!token) {
    return NextResponse.json(errorBody("UNAUTHORIZED", "Sessiya topilmadi."), { status: 401 });
  }

  const url = `${API_BASE}/${path.join("/")}${req.nextUrl.search}`;

  // `fetch()` normalizes dot-segments in the URL, so a request like
  // /api/proxy/admin/%2e%2e/%2e%2e/actuator/env can escape API_BASE's path
  // prefix and reach non-versioned backend routes. Re-check the normalized
  // pathname (via the URL constructor, which normalizes the same way) before
  // forwarding, catching both raw ".." and encoded "%2e%2e" variants.
  const basePath = new URL(API_BASE).pathname.replace(/\/+$/, "");
  const targetPathname = new URL(url).pathname;
  if (targetPathname !== basePath && !targetPathname.startsWith(`${basePath}/`)) {
    return NextResponse.json(errorBody("BAD_REQUEST", "Noto'g'ri so'rov."), { status: 400 });
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const hasBody = req.method !== "GET" && req.method !== "HEAD" && req.body !== null;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return NextResponse.json(errorBody("NETWORK_ERROR", "Tarmoq xatosi. Internet aloqasini tekshiring."), {
      status: 502,
    });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
