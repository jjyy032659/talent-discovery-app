/**
 * src/auth.ts — NextAuth v5 configuration with AWS Cognito
 *
 * WHY NEXT-AUTH v5?
 * - Unified config in one file (no more /pages/api/auth mess)
 * - Works with App Router's Server Components natively
 * - Session available in both Server Actions and API Routes via auth()
 * - Edge-compatible middleware support out of the box
 *
 * WHY CUSTOM OAUTH PROVIDER (not built-in Cognito OIDC)?
 * - The built-in Cognito provider uses type: "oidc", which validates the
 *   ID token's nonce claim on every sign-in.
 * - When Cognito federates to Google (identity_provider=Google), it generates
 *   its own nonce for the Cognito-Google exchange and puts THAT nonce in the
 *   Cognito ID token — NOT the nonce auth.js originally sent.
 * - auth.js v5 normalizes all OIDC providers to always include nonce in checks,
 *   so setting checks: ["pkce", "state"] is ignored.
 * - Result: every first sign-in throws CallbackRouteError "unexpected ID Token
 *   nonce claim value", silently redirects user back to landing page.
 * - FIX: use type: "oauth" (pure OAuth 2.0, no ID token). auth.js calls the
 *   userinfo endpoint for profile data instead — no ID token, no nonce check.
 *
 * FLOW:
 * 1. User clicks "Sign In" → auth.js redirects to Cognito Hosted UI with identity_provider=Google
 * 2. Cognito redirects straight to Google (no intermediate Cognito page)
 * 3. User authenticates with Google → Google redirects back to Cognito
 * 4. Cognito redirects to /api/auth/callback/cognito with an auth code
 * 5. auth.js exchanges the code for access_token at Cognito's token endpoint
 * 6. auth.js calls Cognito's userinfo endpoint with the access_token
 * 7. Session is stored in a signed cookie (JWT strategy, no DB needed)
 */

import NextAuth from "next-auth";
import type { OAuthConfig } from "next-auth/providers";

// Cognito Hosted UI base URL — used for OAuth endpoints and sign-out.
// Pattern: https://<domain-prefix>.auth.<region>.amazoncognito.com
// This is configured in Terraform: aws_cognito_user_pool_domain.main
const COGNITO_DOMAIN =
  "https://talent-app-dev.auth.ap-southeast-2.amazoncognito.com";

// Profile shape returned by Cognito's /oauth2/userInfo endpoint
interface CognitoUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Custom OAuth 2.0 provider for Cognito.
 *
 * WHY NOT type: "oidc"?
 * See module comment above. Short version: Cognito's nonce handling for
 * federated sign-in is incompatible with auth.js's strict OIDC nonce check.
 *
 * Using type: "oauth" means auth.js:
 * - Does NOT request or validate an ID token
 * - Uses the access_token to call /oauth2/userInfo for profile data
 * - Only applies PKCE + state checks (no nonce) → no mismatch possible
 */
const CognitoProvider: OAuthConfig<CognitoUserInfo> = {
  id: "cognito",
  name: "Cognito",
  type: "oauth",

  clientId: process.env.AUTH_COGNITO_ID!,
  clientSecret: process.env.AUTH_COGNITO_SECRET!,

  // Authorization endpoint — Cognito Hosted UI
  // identity_provider=Google skips the Cognito login page and goes
  // straight to Google OAuth. Without this, users see a Cognito page first.
  authorization: {
    url: `${COGNITO_DOMAIN}/oauth2/authorize`,
    params: {
      scope: "openid email profile",
      identity_provider: "Google",
    },
  },

  // Token endpoint — exchange auth code for access_token
  token: `${COGNITO_DOMAIN}/oauth2/token`,

  // UserInfo endpoint — called with access_token to get profile
  userinfo: `${COGNITO_DOMAIN}/oauth2/userInfo`,

  // PKCE + state protect against CSRF. No nonce needed (and it would break).
  checks: ["pkce", "state"],

  // Map Cognito userinfo fields to auth.js User shape
  profile(profile: CognitoUserInfo) {
    return {
      id: profile.sub,
      name: profile.name ?? null,
      email: profile.email ?? null,
      image: profile.picture ?? null,
    };
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ─── Provider ───────────────────────────────────────────────────────────────
  providers: [CognitoProvider],

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
     *
     * NOTE: with type: "oauth", profile comes from the userinfo endpoint
     * (not from an ID token). The shape matches CognitoUserInfo above.
     */
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // 'sub' = Cognito's unique user ID (UUID). Stable — never changes.
        // Use this as the DynamoDB PK (not email, which can change)
        token.sub = (profile as CognitoUserInfo).sub;
        token.email = (profile as CognitoUserInfo).email;
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
