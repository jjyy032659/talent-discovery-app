"use client";

import { motion } from "framer-motion";
import { Trophy, RefreshCw, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPETENCY_LABELS, type Competency } from "@/types/talent-profile.types";
import type { ScenarioSessionResult } from "@/types/scenario.types";

interface ScenarioSummaryProps {
  result: ScenarioSessionResult;
  onRestart: () => void;
  onContinue: () => void;
}

export function ScenarioSummary({ result, onRestart, onContinue }: ScenarioSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-xl mx-auto space-y-4"
    >
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Session Complete!</h2>
        <p className="text-[var(--muted-foreground)] mt-1">Here are your top competencies</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {result.topCompetencies.slice(0, 3).map((c, i) => (
              <div key={c} className="flex flex-col items-center gap-1">
                <Badge variant={i === 0 ? "default" : "secondary"} className="text-sm px-3 py-1">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {COMPETENCY_LABELS[c]}
                </Badge>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {result.competencyScores[c]}pts
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Narrative Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--secondary-foreground)] leading-relaxed">{result.narrative}</p>
          {result.feedbackPoints.length > 0 && (
            <ul className="mt-3 space-y-1">
              {result.feedbackPoints.map((fp, i) => (
                <li key={i} className="text-xs text-[var(--muted-foreground)] flex gap-2">
                  <span className="text-[var(--primary)]">›</span>
                  {fp}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onRestart} className="flex-1">
          <RefreshCw className="w-4 h-4 mr-2" /> Restart
        </Button>
        <Button onClick={onContinue} className="flex-1">
          View Talent Map <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
