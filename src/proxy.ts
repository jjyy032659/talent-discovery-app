/**
 * src/proxy.ts — Next.js 16 Edge Proxy for route protection
 *
 * WHY "proxy.ts" (not "middleware.ts")?
 * - Next.js 16 renamed the middleware file convention from "middleware" to "proxy"
 * - The API is identical; only the filename changed
 * - This runs on the EDGE before the request reaches page/route handlers
 *
 * HOW ROUTE PROTECTION WORKS:
 * 1. Request arrives at /dashboard/* or /ikigai/* etc.
 * 2. next-auth reads the signed JWT cookie (set at Cognito sign-in)
 * 3. If cookie missing/invalid → redirect to / (landing + sign-in button)
 * 4. If valid → request passes through to the page normally
 *
 * WHY EDGE AUTH (not Server Component auth guard)?
 * - Server Components run AFTER the page is fetched — proxy runs BEFORE
 * - Prevents even partial page renders for unauthenticated users
 * - Auth check = cookie read (sub-millisecond, no DB query)
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // req.auth is null if the user is NOT signed in (no valid JWT cookie)
  const isAuthenticated = !!req.auth;

  // All assessment/dashboard routes require authentication
  const isDashboardRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/ikigai") ||
    req.nextUrl.pathname.startsWith("/scenarios") ||
    req.nextUrl.pathname.startsWith("/anti-talent") ||
    req.nextUrl.pathname.startsWith("/roadmap") ||
    req.nextUrl.pathname.startsWith("/talent-map");

  if (isDashboardRoute && !isAuthenticated) {
    // Redirect unauthenticated users to landing page.
    // ?callbackUrl lets next-auth redirect back after sign-in.
    const loginUrl = new URL("/", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users hitting the landing page → send to dashboard
  if (req.nextUrl.pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

/**
 * Matcher config — which routes to run the proxy on.
 *
 * EXCLUDED (no auth needed):
 * - /api/auth/* — next-auth callback routes (must be open for Cognito redirect!)
 * - _next/static, _next/image — static assets (no auth makes sense)
 * - favicon.ico — browser favicon request
 *
 * "/((?!api/auth|_next/static|_next/image|favicon.ico).*)" =
 *   "everything EXCEPT the above paths"
 */
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
