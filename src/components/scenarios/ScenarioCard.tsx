"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScenarioData } from "@/types/scenario.types";

interface ScenarioCardProps {
  scenario: ScenarioData;
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-[var(--primary)]/20 bg-gradient-to-b from-[var(--card)] to-[var(--secondary)]">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <Badge variant="default" className="text-xs">Scenario</Badge>
          </div>
          <CardTitle className="text-xl leading-snug">{scenario.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-[var(--muted)]/50 rounded-lg p-4 mb-4 border-l-4 border-[var(--primary)]">
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Context</p>
            <p className="text-sm text-[var(--secondary-foreground)]">{scenario.context}</p>
          </div>
          <p className="text-[var(--foreground)] leading-relaxed">{scenario.narrative}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
