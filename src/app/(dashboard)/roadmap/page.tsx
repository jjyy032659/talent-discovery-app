import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { RoadmapGenerateForm } from "@/components/roadmap/RoadmapGenerateForm";

export default function RoadmapPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <AnimatedSection>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Growth Roadmap</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Your personalized Day 1–100 talent development plan, powered by Claude.
          </p>
        </div>
      </AnimatedSection>
      <AnimatedSection delay={0.1}>
        <RoadmapGenerateForm />
      </AnimatedSection>
    </div>
  );
}
