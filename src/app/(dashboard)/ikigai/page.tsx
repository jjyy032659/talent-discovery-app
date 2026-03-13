import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { IkigaiChat } from "@/components/ikigai/IkigaiChat";

export default function IkigaiPage() {
  return (
    <div className="h-full flex flex-col gap-4">
      <AnimatedSection>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Ikigai Generator</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Have a free-form conversation. Claude will analyze your words to map your personality and purpose.
          </p>
        </div>
      </AnimatedSection>
      <AnimatedSection delay={0.1} className="flex-1 min-h-0">
        <IkigaiChat />
      </AnimatedSection>
    </div>
  );
}
