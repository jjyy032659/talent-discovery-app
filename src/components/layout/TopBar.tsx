"use client";

import { usePathname } from "next/navigation";
import { Sparkles, Menu } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ikigai": "Ikigai Generator",
  "/scenarios": "Scenario Tests",
  "/anti-talent": "Anti-Talent Filter",
  "/roadmap": "Growth Roadmap",
  "/talent-map": "Talent Map",
};

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname ?? ""] ?? "TalentDiscover";

  return (
    <header className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>

      <h1 className="text-base font-semibold text-[var(--foreground)]">{title}</h1>

      {/* Push auth button to the right */}
      <div className="ml-auto">
        <AuthButton showEmail />
      </div>
    </header>
  );
}
