"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Radar } from "lucide-react";

export function HeroCTAButtons() {
  const { data: session } = useSession();
  const router = useRouter();

  function go(path: string) {
    if (session) {
      router.push(path);
    } else {
      // Unauthenticated — sign in first, then land on the target page
      void signIn("cognito", { redirectTo: path });
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <button
        onClick={() => go("/dashboard")}
        className="flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-8 py-3 rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:shadow-[var(--primary)]/25"
      >
        Begin Your Journey <ArrowRight className="w-5 h-5" />
      </button>
      <button
        onClick={() => go("/talent-map")}
        className="flex items-center justify-center gap-2 border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] px-8 py-3 rounded-xl font-semibold text-base transition-colors"
      >
        <Radar className="w-5 h-5" /> View Talent Map
      </button>
    </div>
  );
}
