"use client";

/**
 * src/components/auth/AuthButton.tsx — Sign In / Sign Out button + profile dropdown
 *
 * SIGN-IN OPTIONS:
 * - "Sign in with Google" → signIn("cognito") → identity_provider=Google → skips Cognito UI
 * - "Sign in with Email"  → signIn("cognito-email") → Cognito Hosted UI (email/password)
 *
 * PROFILE DROPDOWN (when authenticated):
 * - Click avatar → dropdown shows email, Switch Account, Sign Out
 * - Switch Account = full sign-out (NextAuth + Cognito) so the next sign-in
 *   prompts for a different account rather than reusing the Cognito session
 * - Click outside → dropdown closes
 */

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useState, useRef, useEffect } from "react";

// Cognito logout endpoint — clears the Cognito session cookie.
// Without this, Cognito silently reuses the last authenticated user on next sign-in.
const COGNITO_LOGOUT_URL =
  "https://talent-app-dev.auth.ap-southeast-2.amazoncognito.com/logout" +
  "?client_id=66nas9pa6o8dtph59o9m2dc71n" +
  "&logout_uri=https://talentdiscovery.xyz";

async function clearSession() {
  await signOut({ redirect: false }); // clear NextAuth JWT cookie
  window.location.href = COGNITO_LOGOUT_URL; // clear Cognito session
}

interface AuthButtonProps {
  showEmail?: boolean;
  className?: string;
}

export function AuthButton({ showEmail = false, className }: AuthButtonProps) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  if (status === "loading") {
    return <LoadingSpinner size="sm" />;
  }

  if (status === "authenticated" && session) {
    const initial = session.user?.email?.[0]?.toUpperCase() ?? "U";
    const email = session.user?.email ?? "";

    return (
      <div className={`flex items-center gap-3 ${className ?? ""}`}>
        {showEmail && email && (
          <span
            className="text-sm hidden sm:block"
            style={{ color: "var(--muted-foreground)" }}
          >
            {email}
          </span>
        )}

        {/* Clickable avatar with dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              background: "var(--primary)",
              color: "white",
              // @ts-expect-error CSS custom property
              "--tw-ring-color": "var(--primary)",
            }}
            title={`Signed in as ${email}`}
            aria-label="Account menu"
            aria-expanded={open}
          >
            {initial}
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-lg shadow-lg border z-50 overflow-hidden"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              {/* Current account */}
              <div
                className="px-3 py-2.5 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Signed in as
                </p>
                <p className="text-sm font-medium truncate">{email}</p>
              </div>

              {/* Switch Account */}
              <button
                className="w-full text-left px-3 py-2 text-sm transition-colors hover:opacity-80"
                style={{ color: "var(--foreground)" }}
                onClick={() => { setOpen(false); void clearSession(); }}
              >
                Switch Account
              </button>

              {/* Sign Out */}
              <button
                className="w-full text-left px-3 py-2 text-sm transition-colors hover:opacity-80"
                style={{ color: "var(--foreground)" }}
                onClick={() => { setOpen(false); void clearSession(); }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Unauthenticated — show two sign-in options
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => signIn("cognito-email", { redirectTo: "/dashboard" })}
      >
        Sign in with Email
      </Button>
      <Button
        size="sm"
        onClick={() => signIn("cognito", { redirectTo: "/dashboard" })}
      >
        Sign in with Google
      </Button>
    </div>
  );
}
