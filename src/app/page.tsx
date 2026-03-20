import { Sparkles, Star } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { DemoIkigaiChat } from "@/components/demo/DemoIkigaiChat";
import { HeroCTAButtons } from "@/components/demo/HeroCTAButtons";
import { FeatureGrid } from "@/components/demo/FeatureCard";
import { FeatureShowcase } from "@/components/demo/FeatureShowcase";

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
          Powered by Gemini AI
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

      {/* Quick feature overview */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <h2 className="text-2xl font-bold text-center text-[var(--foreground)] mb-2">Five Powerful Assessments</h2>
        <p className="text-center text-[var(--muted-foreground)] mb-10">Each tool adds more depth to your talent profile</p>
        <FeatureGrid />
      </section>

      {/* Detailed feature showcase with live previews */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-3">See exactly what you get</h2>
          <p className="text-[var(--muted-foreground)] max-w-xl mx-auto">
            Every assessment generates real outputs. Here is what your profile looks like after completing each one.
          </p>
        </div>
        <FeatureShowcase />
      </section>
    </div>
  );
}
