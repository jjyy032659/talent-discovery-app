"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { scoreToColor } from "@/lib/utils";
import type { TalentDimension } from "@/types/talent-profile.types";

interface TalentScoreListProps {
  dimensions: TalentDimension[];
}

export function TalentScoreList({ dimensions }: TalentScoreListProps) {
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      {sorted.map((dim, i) => (
        <motion.div
          key={dim.key}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-[var(--foreground)]">{dim.label}</span>
              <p className="text-xs text-[var(--muted-foreground)]">{dim.description}</p>
            </div>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: scoreToColor(dim.score) }}
            >
              {dim.score}
            </span>
          </div>
          <Progress
            value={dim.score}
            className="h-1.5"
            indicatorClassName="transition-all duration-700"
          />
        </motion.div>
      ))}
    </div>
  );
}
