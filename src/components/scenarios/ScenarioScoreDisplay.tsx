"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scoreToColor } from "@/lib/utils";
import { COMPETENCY_LABELS, type Competency } from "@/types/talent-profile.types";

interface ScenarioScoreDisplayProps {
  scores: Partial<Record<Competency, number>>;
  maxScore?: number;
}

export function ScenarioScoreDisplay({ scores, maxScore = 30 }: ScenarioScoreDisplayProps) {
  const entries = Object.entries(scores).filter(([, v]) => (v ?? 0) > 0) as [Competency, number][];
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider">
          Competency Scores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {entries
          .sort(([, a], [, b]) => b - a)
          .map(([key, value]) => {
            const pct = Math.min(100, (value / maxScore) * 100);
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--secondary-foreground)]">{COMPETENCY_LABELS[key]}</span>
                  <span className="font-medium" style={{ color: scoreToColor(pct) }}>{value}pts</span>
                </div>
                <Progress
                  value={pct}
                  indicatorClassName="transition-all duration-700"
                  style={{ "--tw-progress-color": scoreToColor(pct) } as React.CSSProperties}
                />
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}
