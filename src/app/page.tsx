import { Sparkles, Brain, ThumbsDown, Map, Radar, Star } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { DemoIkigaiChat } from "@/components/demo/DemoIkigaiChat";
import { HeroCTAButtons } from "@/components/demo/HeroCTAButtons";
import { FeatureCard } from "@/components/demo/FeatureCard";

const features = [
  {
    icon: Sparkles,
    title: "Ikigai Generator",
    description: "Have a free-form conversation. Claude analyzes your words to map your personality using Big Five, Holland Codes, and MBTI.",
    href: "/ikigai",
    color: "#6c63ff",
    gradient: "from-[#6c63ff]/20 to-[#6c63ff]/5",
  },
  {
    icon: Brain,
    title: "Scenario Testing",
    description: "Face unique 'What would you do?' dilemmas. AI scores you on leadership, empathy, analytical thinking, and more.",
    href: "/scenarios",
    color: "#f59e0b",
    gradient: "from-[#f59e0b]/20 to-[#f59e0b]/5",
  },
  {
    icon: ThumbsDown,
    title: "Anti-Talent Filter",
    description: "Swipe on tasks to reveal what drains you. Claude identifies hidden strengths from your avoidance patterns.",
    href: "/anti-talent",
    color: "#ff6584",
    gradient: "from-[#ff6584]/20 to-[#ff6584]/5",
  },
  {
    icon: Map,
    title: "Growth Roadmap",
    description: "Get a personalized Day 1–100 plan for developing your talent, with books, projects, and milestones.",
    href: "/roadmap",
    color: "#22c55e",
    gradient: "from-[#22c55e]/20 to-[#22c55e]/5",
  },
  {
    icon: Radar,
    title: "Talent Map",
    description: "Visualize your strengths as a spider chart across 8 competency dimensions, updated as you complete assessments.",
    href: "/talent-map",
    color: "#06b6d4",
    gradient: "from-[#06b6d4]/20 to-[#06b6d4]/5",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[var(--foreground)]">TalentDiscover</span>
        </div>
        <AuthButton />
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-full px-4 py-1.5 text-sm text-[var(--primary)] mb-6">
          <Star className="w-3.5 h-3.5" />
          Powered by Claude AI
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-[var(--foreground)] mb-6 leading-tight">
          Discover Your{" "}
          <span
            className="bg-clip-text"
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundImage: "linear-gradient(135deg, var(--primary), var(--accent))",
            }}
          >
            Hidden Talents
          </span>
        </h1>
        <p className="text-xl text-[var(--muted-foreground)] mb-8 max-w-2xl mx-auto leading-relaxed">
          An AI-powered platform that uses advanced psychology frameworks to uncover your unique strengths,
          map your Ikigai, and build your personalized growth roadmap.
        </p>
        <HeroCTAButtons />
      </section>

      {/* Live Demo */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full px-4 py-1.5 text-sm text-[var(--accent)] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            No sign-in required
          </div>
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-2">Try it live</h2>
          <p className="text-[var(--muted-foreground)] max-w-xl mx-auto">
            Have a real conversation with AI. See your Ikigai, MBTI type, Big Five, and Holland Codes generated in real time.
          </p>
        </div>
        <DemoIkigaiChat />
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center text-[var(--foreground)] mb-2">Five Powerful Assessments</h2>
        <p className="text-center text-[var(--muted-foreground)] mb-10">Each tool adds more depth to your talent profile</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <FeatureCard key={feature.href} {...feature} />
          ))}
        </div>
      </section>
    </div>
  );
}
