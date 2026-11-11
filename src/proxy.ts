import { NextResponse, type NextRequest } from "next/server";

function apiCookieIsLocal(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!/^https?:\/\//i.test(apiUrl)) return true;
  try {
    const parsedApi = new URL(apiUrl);
    const parsedReq = request.nextUrl;
    const apiPort = parsedApi.port || (parsedApi.protocol === "https:" ? "443" : "80");
    const reqPort = parsedReq.port || (parsedReq.protocol === "https:" ? "443" : "80");
    return parsedApi.hostname === parsedReq.hostname && apiPort === reqPort;
  } catch {
    return true;
  }
}

export function proxy(request: NextRequest) {
  const protectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname === "/messages" ||
    request.nextUrl.pathname === "/favorites";
  // When the API lives on another host (e.g. the deployed frontend calls a
  // separate API domain), its session cookie is scoped to that domain and is
  // never visible here. The dashboard layout verifies the session client-side.
  const hasSession =
    !apiCookieIsLocal(request) ||
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");
  if (protectedRoute && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/messages", "/favorites"] };
