"use client";

/**
 * src/components/auth/AuthButton.tsx — Sign In / Sign Out button
 *
 * WHY "use client"?
 * - We use useSession() which is a React hook (client-side state)
 * - onClick handlers are client-side events
 * - The session state drives conditional rendering (signed-in vs out)
 *
 * WHY useSession() instead of reading session in a Server Component?
 * - This button lives in the TopBar which is already "use client" for
 *   mobile nav state. Mixing server/client in one component is complex.
 * - useSession() is instant (reads from memory, no network request after
 *   initial SessionProvider hydration)
 *
 * SIGN-IN FLOW:
 * 1. User clicks "Sign In" → calls next-auth signIn("cognito")
 * 2. Browser redirects to Cognito Hosted UI (AWS-managed login page)
 * 3. User enters credentials → Cognito redirects back to /api/auth/callback/cognito
 * 4. next-auth exchanges code for tokens, creates JWT cookie
 * 5. Middleware sees valid cookie → allows dashboard access
 */

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface AuthButtonProps {
  /** Optional: show user email next to button when signed in */
  showEmail?: boolean;
  /** Optional: custom className for styling */
  className?: string;
}

export function AuthButton({ showEmail = false, className }: AuthButtonProps) {
  // useSession() returns:
  // - status: "loading" | "authenticated" | "unauthenticated"
  // - data: Session object (or null if unauthenticated)
  const { data: session, status } = useSession();

  if (status === "loading") {
    // Show spinner while session is being hydrated from cookie
    return <LoadingSpinner size="sm" />;
  }

  if (status === "authenticated" && session) {
    return (
      <div className={`flex items-center gap-3 ${className ?? ""}`}>
        {showEmail && session.user?.email && (
          <span
            className="text-sm hidden sm:block"
            style={{ color: "var(--muted-foreground)" }}
          >
            {session.user.email}
          </span>
        )}
        {/* Avatar circle from user initials */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: "var(--primary)", color: "white" }}
          title={session.user?.email ?? ""}
        >
          {session.user?.email?.[0]?.toUpperCase() ?? "U"}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          // callbackUrl: where to redirect after sign-out (our landing page)
        >
          Sign Out
        </Button>
      </div>
    );
  }

  // Not authenticated: show Sign In button
  return (
    <Button
      size="sm"
      onClick={() => signIn("cognito", undefined, { prompt: "select_account" })}
      // "cognito" = the provider ID from our NextAuth config
      // prompt=select_account forces Google account picker on every sign-in
      className={className}
    >
      Sign In
    </Button>
  );
}
