"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AntiTalentResult as AntiTalentResultType } from "@/types/anti-talent.types";
import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";

interface AntiTalentResultProps {
  result: AntiTalentResultType;
}

export function AntiTalentResult({ result }: AntiTalentResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Hidden Strengths */}
      <Card className="border-[var(--primary)]/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
            Hidden Strengths Discovered
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.hiddenStrengths.map((hs, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium text-[var(--foreground)]">{hs.strength}</span>
                <span className="text-[var(--primary)]">{hs.confidence}%</span>
              </div>
              <Progress value={hs.confidence} indicatorClassName="bg-[var(--primary)]" />
              <p className="text-xs text-[var(--muted-foreground)]">{hs.rationale}</p>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Patterns */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="w-4 h-4 text-[#f59e0b]" />
            Energy Drain Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {result.patterns.map((p, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Redirect Suggestion */}
      <Card className="border-[#22c55e]/20 bg-[#22c55e]/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[#22c55e]">Career Redirect Suggestion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--secondary-foreground)] leading-relaxed">
            {result.redirectSuggestion}
          </p>
        </CardContent>
      </Card>

      {/* Avoidance Dimensions */}
      {result.avoidanceDimensions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <AlertTriangle className="w-4 h-4 text-[var(--accent)]" />
              Dimensions to Avoid in Career Paths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.avoidanceDimensions.map((d, i) => (
                <Badge key={i} variant="destructive" className="text-xs">{d}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
