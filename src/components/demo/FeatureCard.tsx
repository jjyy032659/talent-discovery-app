"use client";

/**
 * FeatureGrid — client component that owns the features data + click handling.
 *
 * WHY client component with data inside?
 * page.tsx is a Server Component. Passing LucideIcon functions (Sparkles,
 * Brain, etc.) as props to a Client Component crosses the Server/Client
 * boundary, which Next.js forbids ("Functions cannot be passed directly to
 * Client Components"). Moving the data here keeps everything client-side.
 */

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Brain, ThumbsDown, Map, Radar } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const features: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  color: string;
  gradient: string;
}[] = [
  {
    icon: Sparkles,
    title: "Ikigai Generator",
    description:
      "Have a free-form conversation. AI analyzes your words to map your personality using Big Five, Holland Codes, and MBTI.",
    href: "/ikigai",
    color: "#6c63ff",
    gradient: "from-[#6c63ff]/20 to-[#6c63ff]/5",
  },
  {
    icon: Brain,
    title: "Scenario Testing",
    description:
      "Face unique 'What would you do?' dilemmas. AI scores you on leadership, empathy, analytical thinking, and more.",
    href: "/scenarios",
    color: "#f59e0b",
    gradient: "from-[#f59e0b]/20 to-[#f59e0b]/5",
  },
  {
    icon: ThumbsDown,
    title: "Anti-Talent Filter",
    description:
      "Swipe on tasks to reveal what drains you. AI identifies hidden strengths from your avoidance patterns.",
    href: "/anti-talent",
    color: "#ff6584",
    gradient: "from-[#ff6584]/20 to-[#ff6584]/5",
  },
  {
    icon: Map,
    title: "Growth Roadmap",
    description:
      "Get a personalized Day 1–100 plan for developing your talent, with books, projects, and milestones.",
    href: "/roadmap",
    color: "#22c55e",
    gradient: "from-[#22c55e]/20 to-[#22c55e]/5",
  },
  {
    icon: Radar,
    title: "Talent Map",
    description:
      "Visualize your strengths as a spider chart across 8 competency dimensions, updated as you complete assessments.",
    href: "/talent-map",
    color: "#06b6d4",
    gradient: "from-[#06b6d4]/20 to-[#06b6d4]/5",
  },
];

export function FeatureGrid() {
  const { data: session } = useSession();
  const router = useRouter();

  function go(href: string) {
    if (session) {
      router.push(href);
    } else {
      void signIn("cognito", { redirectTo: href });
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((f) => (
        <div
          key={f.href}
          onClick={() => go(f.href)}
          className={`group p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-br ${f.gradient} transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full`}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: `${f.color}20`, border: `1px solid ${f.color}30` }}
          >
            <f.icon className="w-6 h-6" style={{ color: f.color }} />
          </div>
          <h3 className="font-semibold text-[var(--foreground)] mb-2">{f.title}</h3>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            {f.description}
          </p>
          <div
            className="flex items-center gap-1 mt-4 text-xs font-medium"
            style={{ color: f.color }}
          >
            Get started <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
