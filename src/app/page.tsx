import Link from "next/link";
import { Sparkles, Brain, ThumbsDown, Map, Radar, ArrowRight, Star } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";

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
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-8 py-3 rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:shadow-[var(--primary)]/25"
          >
            Begin Your Journey <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/talent-map"
            className="flex items-center justify-center gap-2 border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] px-8 py-3 rounded-xl font-semibold text-base transition-colors"
          >
            View Talent Map
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center text-[var(--foreground)] mb-2">Five Powerful Assessments</h2>
        <p className="text-center text-[var(--muted-foreground)] mb-10">Each tool adds more depth to your talent profile</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <div
                className={`group p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-br ${feature.gradient} hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full`}
                style={{ "--hover-border": feature.color } as React.CSSProperties}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feature.color}20`, border: `1px solid ${feature.color}30` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{feature.description}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-medium" style={{ color: feature.color }}>
                  Get started <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
