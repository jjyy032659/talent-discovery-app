/**
 * src/app/layout.tsx — Root layout (Server Component)
 *
 * SessionProvider wraps the entire app so all client components can access
 * the auth session via useSession() without prop drilling.
 *
 * WHY SessionProvider in the ROOT layout?
 * - It sets up a React Context that provides the session everywhere
 * - It uses a background fetch to keep the session fresh automatically
 * - Without it, useSession() returns { status: "loading", data: null } forever
 *
 * WHY is this a Server Component even though SessionProvider is a Client Component?
 * - Next.js allows Server Components to RENDER Client Components
 * - The layout itself doesn't use any client APIs (no useState, no event handlers)
 * - We pass session data from auth() (server) → SessionProvider (client) via props,
 *   which skips the initial client-side fetch → faster page load
 */

import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentDiscover — Find Your Ikigai",
  description: "AI-powered talent discovery platform to uncover your unique strengths and purpose",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // auth() reads the JWT cookie on the server — zero network round-trip.
  // Passing session to SessionProvider avoids an extra /api/auth/session
  // fetch on the client after hydration (better performance).
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/*
          session prop: pre-populates SessionProvider with server-side session data.
          Without this, the client would fetch /api/auth/session on mount,
          causing a brief "loading" flash before the UI renders correctly.
        */}
        <SessionProvider session={session}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
