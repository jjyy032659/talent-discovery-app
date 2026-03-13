/**
 * src/app/api/auth/[...nextauth]/route.ts
 *
 * This file wires next-auth v5 into Next.js App Router.
 *
 * WHY [...nextauth]?
 * The catch-all route handles ALL next-auth endpoints under /api/auth/:
 *   GET  /api/auth/signin           — redirects to Cognito Hosted UI
 *   GET  /api/auth/callback/cognito — receives the OAuth2 code from Cognito
 *   GET  /api/auth/session          — returns current session as JSON
 *   GET  /api/auth/csrf             — CSRF token for form submissions
 *   POST /api/auth/signout          — sign-out action (CSRF-protected)
 *
 * WHY RE-EXPORT handlers (not inline config)?
 * next-auth v5 uses a centralized src/auth.ts config. The route file is just
 * a thin adapter. This separation means auth.ts can be imported in Server
 * Components, Server Actions, and middleware without circular dependencies.
 *
 * IMPORTANT: This route MUST be excluded from middleware protection.
 * See src/middleware.ts matcher — /api/auth/* is excluded.
 * If it wasn't, Cognito's redirect to /api/auth/callback/cognito would be blocked!
 *
 * WHY BOTH GET AND POST?
 * - GET: session reads, sign-in redirect, CSRF token
 * - POST: sign-out (CSRF-protected), OAuth token exchange callback
 * next-auth uses POST for state-changing operations to prevent CSRF.
 */

import { handlers } from "@/auth";

// handlers = { GET: RouteHandler, POST: RouteHandler }
// We destructure and re-export to match Next.js App Router route convention
export const { GET, POST } = handlers;
