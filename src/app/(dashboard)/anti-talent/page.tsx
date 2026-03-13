import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SwipeDeck } from "@/components/anti-talent/SwipeDeck";

export default function AntiTalentPage() {
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <AnimatedSection>
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--foreground)]">Anti-Talent Filter</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Swipe right on tasks that energize you, left on those that drain you. Claude will reveal hidden patterns.
          </p>
        </div>
      </AnimatedSection>
      <AnimatedSection delay={0.1}>
        <SwipeDeck />
      </AnimatedSection>
    </div>
  );
}
