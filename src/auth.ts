import NextAuth from "next-auth";
import type { OAuthConfig } from "next-auth/providers";

const COGNITO_DOMAIN =
  "https://talent-app-dev.auth.ap-southeast-2.amazoncognito.com";

interface CognitoUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

// Shared token config for both Cognito providers.
// Cognito always returns an id_token alongside access_token. Auth.js validates
// any id_token it finds — but when federating through Google, Cognito puts its
// own nonce in the token (not the one auth.js sent), so validation always fails.
// Stripping id_token here forces auth.js to use the userinfo endpoint instead.
function cognitoToken(url: string) {
  return {
    url,
    async conform(response: Response): Promise<Response> {
      const body = (await response.clone().json()) as Record<string, unknown>;
      delete body.id_token;
      return new Response(JSON.stringify(body), {
        status: response.status,
        headers: response.headers,
      });
    },
  };
}

function cognitoProfile(profile: CognitoUserInfo) {
  return {
    id: profile.sub,
    name: profile.name ?? null,
    email: profile.email ?? null,
    image: profile.picture ?? null,
  };
}

// Goes straight to Google, skips the Cognito hosted UI entirely
const CognitoGoogleProvider: OAuthConfig<CognitoUserInfo> = {
  id: "cognito",
  name: "Google",
  type: "oauth",
  clientId: process.env.AUTH_COGNITO_ID!,
  clientSecret: process.env.AUTH_COGNITO_SECRET!,
  authorization: {
    url: `${COGNITO_DOMAIN}/oauth2/authorize`,
    params: { scope: "openid email profile", identity_provider: "Google" },
  },
  token: cognitoToken(`${COGNITO_DOMAIN}/oauth2/token`),
  userinfo: `${COGNITO_DOMAIN}/oauth2/userInfo`,
  checks: ["pkce", "state"],
  profile: cognitoProfile,
};

// Shows Cognito hosted UI — email/password or any configured IdP
const CognitoEmailProvider: OAuthConfig<CognitoUserInfo> = {
  id: "cognito-email",
  name: "Cognito Email",
  type: "oauth",
  clientId: process.env.AUTH_COGNITO_ID!,
  clientSecret: process.env.AUTH_COGNITO_SECRET!,
  authorization: {
    url: `${COGNITO_DOMAIN}/oauth2/authorize`,
    params: { scope: "openid email profile" },
  },
  token: cognitoToken(`${COGNITO_DOMAIN}/oauth2/token`),
  userinfo: `${COGNITO_DOMAIN}/oauth2/userInfo`,
  checks: ["pkce", "state"],
  profile: cognitoProfile,
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [CognitoGoogleProvider, CognitoEmailProvider],

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist sub + email on first sign-in; sub is the DynamoDB partition key
      if (account && profile) {
        token.sub = (profile as CognitoUserInfo).sub;
        token.email = (profile as CognitoUserInfo).email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
  },
});

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
