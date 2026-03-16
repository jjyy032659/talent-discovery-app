"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { Wand2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RoadmapRenderer } from "./RoadmapRenderer";
import { useRoadmapStore } from "@/store/roadmap.store";
import { useTalentProfileStore } from "@/store/talent-profile.store";
import { useIkigaiStore } from "@/store/ikigai.store";
import { getRoadmapMetadata } from "@/actions/roadmap.actions";
import toast from "react-hot-toast";

export function RoadmapGenerateForm() {
  const [isPending, startTransition] = useTransition();
  const { rawMarkdown, isStreaming, streamComplete, metadata, setStreaming, appendMarkdown, setStreamComplete, setMetadata, reset } = useRoadmapStore();
  const { dimensions, topTalents, avoidanceAreas } = useTalentProfileStore();
  const { analysisResult } = useIkigaiStore();

  const handleGenerate = () => {
    reset();
    startTransition(async () => {
      // First get metadata
      const metaResult = await getRoadmapMetadata({ dimensions, topTalents, avoidanceAreas });
      if (metaResult.success) {
        setMetadata(metaResult.data);
      }

      // Then stream the roadmap
      setStreaming(true);
      try {
        const ikigaiSummary = analysisResult
          ? `Ikigai insights: ${analysisResult.insights.join(". ")}`
          : undefined;

        const response = await fetch("/api/stream/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: { dimensions, topTalents, avoidanceAreas },
            ikigaiSummary,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Stream failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          appendMarkdown(decoder.decode(value, { stream: true }));
        }
        setStreamComplete();
      } catch {
        setStreaming(false);
        toast.error("Failed to generate roadmap");
      }
    });
  };

  const hasProfile = dimensions.some((d) => d.score > 0) || topTalents.length > 0;

  return (
    <div className="space-y-4">
      {/* Header card */}
      {!streamComplete && !isStreaming && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-[#22c55e]/20 bg-[#22c55e]/5">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Your Personal Growth Roadmap</h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {hasProfile
                  ? "Claude will create a personalized Day 1–100 plan based on your talent profile."
                  : "Complete the Ikigai Generator or Scenario Tests first for a personalized roadmap."}
              </p>
              {metadata && (
                <div className="text-left bg-[var(--card)] rounded-lg p-3 mb-4">
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">Your roadmap focus</p>
                  <p className="font-semibold text-[var(--foreground)]">{metadata.title}</p>
                </div>
              )}
              <Button onClick={handleGenerate} disabled={isPending} size="lg" className="w-full">
                {isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-2" /> Generate My Roadmap</>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Roadmap content */}
      {(rawMarkdown || isStreaming) && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
          {streamComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={isPending}
              className="float-right text-xs text-[var(--muted-foreground)]"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Regenerate
            </Button>
          )}
          <RoadmapRenderer markdown={rawMarkdown} isStreaming={isStreaming} />
        </div>
      )}
    </div>
  );
}
