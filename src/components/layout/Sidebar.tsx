"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  ThumbsDown,
  Map,
  Radar,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", color: "#a78bfa" },
  { href: "/ikigai", icon: Sparkles, label: "Ikigai Generator", color: "#6c63ff" },
  { href: "/scenarios", icon: Brain, label: "Scenario Tests", color: "#f59e0b" },
  { href: "/anti-talent", icon: ThumbsDown, label: "Anti-Talent Filter", color: "#ff6584" },
  { href: "/roadmap", icon: Map, label: "Growth Roadmap", color: "#22c55e" },
  { href: "/talent-map", icon: Radar, label: "Talent Map", color: "#06b6d4" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[var(--card)] border-r border-[var(--border)] p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 py-4 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-[var(--foreground)] leading-none">TalentDiscover</p>
          <p className="text-xs text-[var(--muted-foreground)]">Find your ikigai</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                <item.icon
                  className="w-4.5 h-4.5 shrink-0"
                  style={{ color: isActive ? item.color : undefined }}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--muted-foreground)] px-2">
          Powered by Claude AI
        </p>
      </div>
    </aside>
  );
}
