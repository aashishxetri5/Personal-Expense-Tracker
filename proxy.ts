import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const LOGIN_PATH = "/login";

/**
 * Redirects signed-out visitors to the login page before a route renders.
 *
 * This is an optimistic gate for the redirect experience only — Next's own docs
 * warn against treating a proxy as the authorization layer, so every server
 * action, page and export route independently calls `requireSession()`.
 *
 * @param request - The incoming request.
 * @returns A redirect for signed-out visitors, otherwise the request continues.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === LOGIN_PATH) {
    if (!signedIn) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (signedIn) return NextResponse.next();

  const loginUrl = new URL(LOGIN_PATH, request.url);
  // Send the visitor back where they were headed once they sign in.
  if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except Next's own assets and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
