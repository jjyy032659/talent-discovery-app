"use client";

import { useCallback, useEffect, useTransition } from "react";
import { AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwipeCard } from "./SwipeCard";
import { AntiTalentResult } from "./AntiTalentResult";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAntiTalentStore } from "@/store/anti-talent.store";
import { useTalentProfileStore } from "@/store/talent-profile.store";
import { generateTaskDeck } from "@/actions/scenario.actions";
import { analyzeAntiTalent } from "@/actions/anti-talent.actions";
import toast from "react-hot-toast";

export function SwipeDeck() {
  const [isPending, startTransition] = useTransition();
  const {
    taskDeck,
    likedTasks,
    dislikedTasks,
    currentCardIndex,
    analysisResult,
    isAnalyzing,
    deckExhausted,
    setTaskDeck,
    swipeLeft,
    swipeRight,
    setAnalysisResult,
    setAnalyzing,
    reset,
  } = useAntiTalentStore();
  const { updateFromAntiTalent } = useTalentProfileStore();

  const loadDeck = () => {
    startTransition(async () => {
      const result = await generateTaskDeck();
      if (result.success) {
        setTaskDeck(result.data);
      } else {
        toast.error("Failed to load tasks");
      }
    });
  };

  const handleAnalyze = useCallback(() => {
    setAnalyzing(true);
    startTransition(async () => {
      const result = await analyzeAntiTalent(dislikedTasks, likedTasks);
      setAnalyzing(false);
      if (result.success) {
        setAnalysisResult(result.data);
        updateFromAntiTalent(
          result.data.avoidanceDimensions,
          result.data.hiddenStrengths.map((s) => s.strength)
        );
      } else {
        toast.error(result.error ?? "Analysis failed");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dislikedTasks, likedTasks, setAnalysisResult, setAnalyzing, startTransition, updateFromAntiTalent]);

  useEffect(() => {
    if (taskDeck.length === 0) {
      loadDeck();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (deckExhausted && dislikedTasks.length >= 3 && !analysisResult) {
      handleAnalyze();
    }
  }, [deckExhausted, dislikedTasks.length, analysisResult, handleAnalyze]);

  if (isPending && taskDeck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-[var(--muted-foreground)]">Generating your task deck...</p>
      </div>
    );
  }

  if (analysisResult) {
    return (
      <div className="space-y-4">
        <AntiTalentResult result={analysisResult} />
        <Button variant="outline" onClick={reset} className="w-full">Start Over</Button>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-[var(--muted-foreground)]">Analyzing your preferences...</p>
        <p className="text-xs text-[var(--muted-foreground)]">Identifying hidden patterns in your choices</p>
      </div>
    );
  }

  if (deckExhausted) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <div className="text-4xl">🎯</div>
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Deck Complete!</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          You liked {likedTasks.length} tasks and passed on {dislikedTasks.length}.
        </p>
        {dislikedTasks.length < 3 ? (
          <p className="text-xs text-[var(--accent)]">Need at least 3 passes to analyze patterns.</p>
        ) : (
          <Button onClick={handleAnalyze} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Analyze My Anti-Talents
          </Button>
        )}
      </div>
    );
  }

  const currentTask = taskDeck[currentCardIndex];
  if (!currentTask) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress */}
      <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
        <span>{currentCardIndex + 1} / {taskDeck.length}</span>
        <div className="flex gap-1">
          {taskDeck.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i < currentCardIndex
                  ? "var(--primary)"
                  : i === currentCardIndex
                  ? "var(--accent)"
                  : "var(--muted)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Card deck */}
      <div className="relative w-full max-w-sm h-96">
        <AnimatePresence>
          <SwipeCard
            key={currentTask.id}
            task={currentTask}
            onSwipeLeft={() => swipeLeft(currentTask)}
            onSwipeRight={() => swipeRight(currentTask)}
            isTop={true}
          />
        </AnimatePresence>
        {currentCardIndex + 1 < taskDeck.length && (
          <SwipeCard
            key={`${taskDeck[currentCardIndex + 1]?.id}-bg`}
            task={taskDeck[currentCardIndex + 1]}
            onSwipeLeft={() => {}}
            onSwipeRight={() => {}}
            isTop={false}
          />
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-6">
        <Button
          variant="outline"
          size="lg"
          onClick={() => swipeLeft(currentTask)}
          className="w-16 h-16 rounded-full border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-400"
        >
          <ThumbsDown className="w-6 h-6" />
        </Button>
        <Button
          size="lg"
          onClick={() => swipeRight(currentTask)}
          className="w-16 h-16 rounded-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400"
          variant="outline"
        >
          <ThumbsUp className="w-6 h-6" />
        </Button>
      </div>

      {/* Analyze early button */}
      {dislikedTasks.length >= 5 && (
        <Button variant="ghost" size="sm" onClick={handleAnalyze} className="text-xs text-[var(--muted-foreground)]">
          Analyze now ({dislikedTasks.length} passes so far)
        </Button>
      )}
    </div>
  );
}
