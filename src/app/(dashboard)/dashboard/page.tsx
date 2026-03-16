"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Brain, ThumbsDown, Map, Radar, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { useIkigaiStore } from "@/store/ikigai.store";
import { useScenarioStore } from "@/store/scenario.store";
import { useAntiTalentStore } from "@/store/anti-talent.store";
import { useRoadmapStore } from "@/store/roadmap.store";
import { useTalentProfileStore } from "@/store/talent-profile.store";

const steps = [
  { href: "/ikigai", icon: Sparkles, label: "Ikigai Generator", color: "#6c63ff", desc: "Map your personality through conversation" },
  { href: "/scenarios", icon: Brain, label: "Scenario Tests", color: "#f59e0b", desc: "Test your competencies in real situations" },
  { href: "/anti-talent", icon: ThumbsDown, label: "Anti-Talent Filter", color: "#ff6584", desc: "Discover strengths through your dislikes" },
  { href: "/roadmap", icon: Map, label: "Growth Roadmap", color: "#22c55e", desc: "Get your Day 1–100 development plan" },
  { href: "/talent-map", icon: Radar, label: "Talent Map", color: "#06b6d4", desc: "Visualize your complete talent profile" },
];

export default function DashboardPage() {
  const { analysisResult } = useIkigaiStore();
  const { sessionComplete, responses } = useScenarioStore();
  const { analysisResult: antiTalentResult } = useAntiTalentStore();
  const { streamComplete } = useRoadmapStore();
  const { dimensions, topTalents } = useTalentProfileStore();

  const completions = [
    !!analysisResult,
    sessionComplete || responses.length >= 3,
    !!antiTalentResult,
    streamComplete,
    dimensions.some((d) => d.score > 0),
  ];
  const completedCount = completions.filter(Boolean).length;
  const profileStrength = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AnimatedSection>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Welcome back</h1>
            <p className="text-[var(--muted-foreground)] mt-1">
              {completedCount === 0
                ? "Start with the Ikigai Generator to begin your talent discovery journey."
                : `You've completed ${completedCount} of ${steps.length} assessments. Keep going!`}
            </p>
          </div>
          <Badge variant="default" className="text-sm px-3 py-1">
            {profileStrength}% Profile
          </Badge>
        </div>
      </AnimatedSection>

      {/* Top talents if available */}
      {topTalents.length > 0 && (
        <AnimatedSection delay={0.1}>
          <Card className="border-[var(--primary)]/20 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10">
            <CardContent className="p-4">
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Your Top Talents</p>
              <div className="flex flex-wrap gap-2">
                {topTalents.map((t) => (
                  <Badge key={t} variant="default">{t}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      )}

      {/* Assessment cards */}
      <div className="grid gap-3">
        {steps.map((step, i) => {
          const isComplete = completions[i];
          return (
            <AnimatedSection key={step.href} delay={0.1 + i * 0.07}>
              <Link href={step.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-all cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${step.color}20`, border: `1px solid ${step.color}30` }}
                  >
                    <step.icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--foreground)] text-sm">{step.label}</p>
                      {isComplete && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">{step.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={isComplete ? "success" : "secondary"} className="text-xs">
                      {isComplete ? "Done" : "Start"}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </div>
                </motion.div>
              </Link>
            </AnimatedSection>
          );
        })}
      </div>
    </div>
  );
}
