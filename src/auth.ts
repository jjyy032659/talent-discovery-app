/**
 * src/auth.ts — NextAuth v5 configuration with AWS Cognito
 *
 * WHY NEXT-AUTH v5?
 * - Unified config in one file (no more /pages/api/auth mess)
 * - Works with App Router's Server Components natively
 * - Session available in both Server Actions and API Routes via auth()
 * - Edge-compatible middleware support out of the box
 *
 * WHY COGNITO AS OIDC PROVIDER?
 * - AWS-managed: no servers to run, auto-scales, handles MFA
 * - Free tier: 50,000 MAU (Monthly Active Users) — $0 for a resume project
 * - Fully OIDC-compliant: next-auth talks to it exactly like Google/GitHub
 * - Integrates natively with IAM for future AWS service access
 *
 * FLOW:
 * 1. User clicks "Sign In" → next-auth redirects to Cognito Hosted UI
 * 2. User signs in/up on Cognito's page → Cognito redirects back with code
 * 3. next-auth exchanges code for tokens (access_token + id_token)
 * 4. We extract user ID (sub) and email from id_token
 * 5. Session is stored in a signed cookie (JWT strategy, no DB needed for sessions)
 */

import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ─── Provider ───────────────────────────────────────────────────────────────
  providers: [
    Cognito({
      // These come from environment variables set in .env.local (dev)
      // or SSM Parameter Store → docker run --env (production).
      // AUTH_COGNITO_ID: the App Client ID from your User Pool
      clientId: process.env.AUTH_COGNITO_ID!,
      // AUTH_COGNITO_SECRET: the App Client Secret (sensitive! never commit)
      clientSecret: process.env.AUTH_COGNITO_SECRET!,
      // AUTH_COGNITO_ISSUER: https://cognito-idp.<region>.amazonaws.com/<pool-id>
      // next-auth fetches /.well-known/openid-configuration from this URL to
      // discover all endpoints automatically (OIDC discovery)
      issuer: process.env.AUTH_COGNITO_ISSUER!,
      // Skip Cognito hosted UI, go straight to Google every time.
      // Without this, users see an intermediate Cognito login page.
      authorization: { params: { identity_provider: "Google" } },
    }),
  ],

  // ─── Session Strategy ────────────────────────────────────────────────────────
  // "jwt" = store session in a signed/encrypted cookie.
  // WHY NOT DATABASE SESSIONS?
  // - We already use DynamoDB for talent data; adding session storage complicates schema
  // - JWT cookies are stateless: no DB query per request, faster response times
  // - Security is handled by AUTH_SECRET (random 32-byte key) that signs the cookie
  session: {
    strategy: "jwt",
    // Session expires after 7 days — user must re-login (Cognito refresh token handles this)
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },

  // ─── Callbacks ───────────────────────────────────────────────────────────────
  callbacks: {
    /**
     * jwt() runs when a token is created (sign-in) or accessed (any request).
     * We copy the Cognito 'sub' (stable user identifier) into the token so it
     * survives across requests. The 'sub' is the DynamoDB partition key.
     */
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // 'sub' = Cognito's unique user ID (UUID). Stable — never changes.
        // Use this as the DynamoDB PK (not email, which can change)
        token.sub = profile.sub as string;
        token.email = profile.email as string;
      }
      return token;
    },

    /**
     * session() shapes what useSession() / auth() returns to the app.
     * We expose the user ID so Server Actions can call DynamoDB.
     */
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub; // DynamoDB key: USER#<sub>
      }
      return session;
    },
  },

  // ─── Pages ────────────────────────────────────────────────────────────────────
  // Custom pages override the default next-auth UI:
  pages: {
    // Our landing page has the Sign In button; unauthenticated users see it.
    signIn: "/",
    // After sign-out, go back to landing page
    signOut: "/",
    // Errors show as ?error= params on the signIn page
    error: "/",
  },
});

/**
 * Module augmentation to add 'id' to the Session User type.
 *
 * WHY: TypeScript doesn't know we added 'id' in the session callback above.
 * This tells TypeScript's type system that session.user.id exists and is a string.
 * Without this, you'd get "Property 'id' does not exist on type 'User'" errors.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
