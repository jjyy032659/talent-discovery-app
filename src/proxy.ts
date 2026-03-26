// Edge middleware for route protection — runs before any page renders.
// next-auth reads the JWT cookie and populates req.auth if valid.

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuthenticated = !!req.auth;

  const isProtected =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/ikigai") ||
    req.nextUrl.pathname.startsWith("/scenarios") ||
    req.nextUrl.pathname.startsWith("/anti-talent") ||
    req.nextUrl.pathname.startsWith("/roadmap") ||
    req.nextUrl.pathname.startsWith("/talent-map");

  if (isProtected && !isAuthenticated) {
    const url = new URL("/", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Landing page is public — it has a live demo for unauthenticated visitors
  return NextResponse.next();
});

export const config = {
  // Skip auth check for next-auth callbacks, static assets, and favicon
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
