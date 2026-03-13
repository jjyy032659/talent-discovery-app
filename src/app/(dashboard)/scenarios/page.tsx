"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { ScenarioCard } from "@/components/scenarios/ScenarioCard";
import { ScenarioChoice } from "@/components/scenarios/ScenarioChoice";
import { ScenarioScoreDisplay } from "@/components/scenarios/ScenarioScoreDisplay";
import { ScenarioSummary } from "@/components/scenarios/ScenarioSummary";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScenarioStore } from "@/store/scenario.store";
import { useTalentProfileStore } from "@/store/talent-profile.store";
import { generateScenario } from "@/actions/scenario.actions";
import type { Competency } from "@/types/talent-profile.types";
import toast from "react-hot-toast";

const MAX_SCENARIOS = 5;

export default function ScenariosPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    currentScenario,
    completedScenarios,
    competencyScores,
    sessionComplete,
    sessionResult,
    isGenerating,
    addResponse,
    setCurrentScenario,
    setGenerating,
    completeSession,
    reset,
  } = useScenarioStore();
  const { updateFromScenario } = useTalentProfileStore();

  useEffect(() => {
    if (!currentScenario && !sessionComplete) {
      loadNextScenario();
    }
  }, []);

  const loadNextScenario = () => {
    setGenerating(true);
    startTransition(async () => {
      const result = await generateScenario(completedScenarios);
      if (result.success) {
        setCurrentScenario(result.data);
      } else {
        toast.error(result.error ?? "Failed to generate scenario");
        setGenerating(false);
      }
    });
  };

  const handleChoice = (choiceId: string) => {
    if (!currentScenario) return;
    const choice = currentScenario.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    addResponse({
      scenarioId: currentScenario.id,
      choiceId,
      scores: choice.scores,
    });

    const newCompletedCount = completedScenarios.length + 1;
    if (newCompletedCount >= MAX_SCENARIOS) {
      // Build session result
      const newScores = { ...competencyScores };
      for (const [k, v] of Object.entries(choice.scores)) {
        newScores[k as Competency] = (newScores[k as Competency] ?? 0) + (v ?? 0);
      }
      const top = (Object.entries(newScores) as [Competency, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k]) => k);

      completeSession({
        competencyScores: newScores,
        topCompetencies: top,
        narrative: `You demonstrated strong ${top[0]} and ${top[1]} in your responses, consistently choosing solutions that reflect these core strengths.`,
        feedbackPoints: [
          `Your highest competency was ${top[0]} (${newScores[top[0]]} points)`,
          `You showed balance between analytical and interpersonal approaches`,
          `Continue to develop ${top[2]} for well-rounded leadership`,
        ],
      });
      updateFromScenario(newScores);
    } else {
      loadNextScenario();
    }
  };

  if (sessionComplete && sessionResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <ScenarioSummary
          result={sessionResult}
          onRestart={reset}
          onContinue={() => router.push("/talent-map")}
        />
      </div>
    );
  }

  if (isGenerating || isPending || !currentScenario) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-[var(--muted-foreground)]">Generating your scenario...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Scenario Test</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Scenario {completedScenarios.length + 1} of {MAX_SCENARIOS}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{MAX_SCENARIOS - completedScenarios.length} left</Badge>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </AnimatedSection>

      <div className="grid lg:grid-cols-[1fr,280px] gap-4">
        <div className="space-y-3">
          <ScenarioCard scenario={currentScenario} />
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--muted-foreground)] px-1">What would you do?</p>
            {currentScenario.choices.map((choice, i) => (
              <ScenarioChoice
                key={choice.id}
                choice={choice}
                index={i}
                onSelect={handleChoice}
                disabled={isPending}
              />
            ))}
          </div>
        </div>
        <div>
          <ScenarioScoreDisplay scores={competencyScores} maxScore={MAX_SCENARIOS * 10} />
        </div>
      </div>
    </div>
  );
}
