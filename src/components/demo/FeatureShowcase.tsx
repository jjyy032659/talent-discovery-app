"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Brain, ThumbsDown, Map, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Preview components ────────────────────────────────────────────────────────
import { IkigaiResultCard } from "@/components/ikigai/IkigaiResultCard";
import { ScenarioScoreDisplay } from "@/components/scenarios/ScenarioScoreDisplay";
import { AntiTalentResult } from "@/components/anti-talent/AntiTalentResult";
import { TalentRadarChart } from "@/components/talent-map/TalentRadarChart";
import { RoadmapRenderer } from "@/components/roadmap/RoadmapRenderer";

// ── Sample data for previews ──────────────────────────────────────────────────

const ikigaiSample = {
  bigFive: {
    openness: 83,
    conscientiousness: 72,
    extraversion: 55,
    agreeableness: 76,
    neuroticism: 34,
  },
  hollandCodes: ["I", "A", "E"] as ("R" | "I" | "A" | "S" | "E" | "C")[],
  mbtiType: "INTJ" as const,
  ikigaiQuadrants: {
    love: ["Problem solving", "Creative projects", "Learning"],
    goodAt: ["Systems thinking", "Writing", "Data analysis"],
    worldNeeds: ["Better software", "AI ethics", "Education tools"],
    paidFor: ["Engineering", "Consulting", "Product design"],
  },
  insights: [
    "Your natural curiosity pairs with systematic execution — rare in creative fields.",
    "You thrive in roles where you design solutions independently with ownership over outcomes.",
    "Your Big Five profile suggests exceptional resilience under ambiguity.",
  ],
  conversationPhase: "complete" as const,
  nextPrompt: "",
};

const scenarioSample = {
  analyticalThinking: 28,
  leadership: 22,
  empathy: 19,
  creativity: 25,
  communication: 21,
  execution: 24,
};

const antiTalentSample = {
  hiddenStrengths: [
    {
      strength: "Strategic Planning",
      confidence: 87,
      rationale:
        "Your avoidance of repetitive tasks reveals a preference for high-level thinking and long-horizon goals.",
    },
    {
      strength: "Creative Problem Solving",
      confidence: 79,
      rationale:
        "Discomfort with rigid rules suggests strong creative adaptability and unconventional thinking.",
    },
    {
      strength: "Independent Execution",
      confidence: 73,
      rationale:
        "Resistance to micromanagement points to high self-direction and intrinsic motivation.",
    },
  ],
  patterns: [
    "Avoids micromanagement",
    "Dislikes repetitive tasks",
    "Resists rigid structure",
    "Prefers ownership over collaboration",
  ],
  redirectSuggestion:
    "Your avoidance patterns consistently point toward leadership and innovation roles — positions where you set direction rather than follow prescribed processes. Consider founding, product strategy, or independent consulting.",
  avoidanceDimensions: [
    "Administrative work",
    "Detail-heavy tasks",
    "Highly structured environments",
  ],
};

const roadmapSample = `## Your 100-Day Growth Roadmap

### Days 1–30: Foundation
- **Week 1:** Read *Thinking, Fast and Slow* — understand your decision-making patterns
- **Week 2:** Build one small project end-to-end using your core skills
- **Week 3:** Join one online community aligned with your target field
- **Week 4:** Ship something publicly, no matter how small

**Milestone:** You have shipped and have one external piece of feedback.

### Days 31–60: Acceleration
- Enrol in one focused course on your highest-growth skill area
- Write weekly 250-word reflections on what you are learning
- Find a peer or mentor for bi-weekly check-ins

**Milestone:** You have produced 8 written reflections and have an accountability partner.

### Days 61–100: Momentum
- Lead a project end-to-end with at least one collaborator
- Present your work to 10+ people — a meetup, a team demo, or a blog post
- Define your 6-month goal and the one skill that unlocks it

**Milestone:** You have a concrete 6-month plan grounded in real feedback.`;

const talentMapSample = [
  { key: "creativity" as const, label: "Creativity", score: 82, description: "Generating novel ideas and solutions" },
  { key: "leadership" as const, label: "Leadership", score: 67, description: "Inspiring and guiding others" },
  { key: "analyticalThinking" as const, label: "Analytical", score: 88, description: "Breaking down complex problems" },
  { key: "empathy" as const, label: "Empathy", score: 71, description: "Understanding and connecting with others" },
  { key: "communication" as const, label: "Communication", score: 74, description: "Expressing ideas clearly" },
  { key: "execution" as const, label: "Execution", score: 79, description: "Turning plans into results" },
  { key: "vision" as const, label: "Vision", score: 85, description: "Seeing big-picture future possibilities" },
  { key: "technicalAptitude" as const, label: "Technical", score: 91, description: "Proficiency with tools and systems" },
];

// ── Feature definitions ───────────────────────────────────────────────────────

const features = [
  {
    icon: Sparkles,
    title: "Ikigai Generator",
    subtitle: "Discover your reason for being",
    color: "#6c63ff",
    href: "/ikigai",
    description:
      "Have a free-form conversation about what excites you, what you excel at, and your past experiences. AI analyses your language in real time to build a complete personality profile.",
    highlights: [
      "Big Five (OCEAN) personality scores",
      "Top 3 Holland Codes (RIASEC)",
      "MBTI type from 16 profiles",
      "Ikigai quadrants: love, skills, world needs, paid for",
      "Key insights written in plain language",
    ],
    preview: <IkigaiResultCard result={ikigaiSample} />,
  },
  {
    icon: Brain,
    title: "Scenario Testing",
    subtitle: "Reveal your decision-making DNA",
    color: "#f59e0b",
    href: "/scenarios",
    description:
      "Face 'What would you do?' dilemmas drawn from real workplace situations. Each answer is scored across 8 competency dimensions, exposing strengths you might not even know you have.",
    highlights: [
      "Leadership & empathy scoring",
      "Analytical and creative thinking metrics",
      "Communication and execution ratings",
      "Competency radar updated after every scenario",
      "Personalised debrief for each choice",
    ],
    preview: (
      <ScenarioScoreDisplay scores={scenarioSample} maxScore={30} />
    ),
  },
  {
    icon: ThumbsDown,
    title: "Anti-Talent Filter",
    subtitle: "Find strengths hidden in your avoidances",
    color: "#ff6584",
    href: "/anti-talent",
    description:
      "Swipe left or right on workplace tasks. What you actively avoid is just as revealing as what you enjoy. AI spots the hidden strengths embedded in your avoidance patterns.",
    highlights: [
      "Hidden strength identification with confidence %",
      "Energy drain pattern analysis",
      "Career path redirect suggestions",
      "Dimensions to avoid in future roles",
      "Rationale for every discovered strength",
    ],
    preview: <AntiTalentResult result={antiTalentSample} />,
  },
  {
    icon: Map,
    title: "Growth Roadmap",
    subtitle: "A personalised Day 1–100 plan",
    color: "#22c55e",
    href: "/roadmap",
    description:
      "Based on your full assessment profile, AI generates a concrete 100-day development plan with books, projects, milestones, and weekly actions tailored to your specific talent combination.",
    highlights: [
      "Personalised to your Ikigai + scenario results",
      "30 / 60 / 100 day milestones",
      "Book recommendations matched to your profile",
      "Actionable weekly tasks",
      "Streams in real time as it generates",
    ],
    preview: (
      <div className="rounded-xl border p-4 text-sm overflow-y-auto" style={{ background: "var(--card)", borderColor: "var(--border)", maxHeight: 340 }}>
        <RoadmapRenderer markdown={roadmapSample} isStreaming={false} />
      </div>
    ),
  },
  {
    icon: Radar,
    title: "Talent Map",
    subtitle: "Your strengths as a visual radar",
    color: "#06b6d4",
    href: "/talent-map",
    description:
      "Every assessment you complete feeds into a live radar chart across 8 competency dimensions. Watch your profile sharpen as you add more data — a single chart that tells your whole talent story.",
    highlights: [
      "8 competency dimensions in one view",
      "Updates automatically after each assessment",
      "Interactive hover for score details",
      "Top talents and areas to avoid",
      "Compare your profile across sessions",
    ],
    preview: (
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <TalentRadarChart dimensions={talentMapSample} />
      </div>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function FeatureShowcase() {
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
    <div className="space-y-24">
      {features.map((f, i) => {
        const isEven = i % 2 === 0;
        return (
          <div
            key={f.href}
            className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 items-center`}
          >
            {/* Text side */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--foreground)]">{f.title}</h3>
                  <p className="text-sm" style={{ color: f.color }}>{f.subtitle}</p>
                </div>
              </div>

              <p className="text-[var(--muted-foreground)] leading-relaxed">{f.description}</p>

              <ul className="space-y-2">
                {f.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-[var(--secondary-foreground)]">
                    <span className="mt-0.5 text-xs" style={{ color: f.color }}>✦</span>
                    {h}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => go(f.href)}
                className="gap-2 mt-2"
                style={{ background: f.color, color: "white" }}
              >
                Try {f.title} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview side */}
            <div className="flex-1 w-full overflow-y-auto" style={{ maxHeight: 480 }}>
              {f.preview}
            </div>
          </div>
        );
      })}
    </div>
  );
}
