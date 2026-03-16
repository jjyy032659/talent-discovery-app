"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { HollandBadge, MBTIBadge } from "./FrameworkBadge";
import type { IkigaiAnalysisResult } from "@/types/ikigai.types";
import { BIG_FIVE_LABELS } from "@/types/ikigai.types";

interface IkigaiResultCardProps {
  result: IkigaiAnalysisResult;
}

export function IkigaiResultCard({ result }: IkigaiResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Personality Frameworks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider">
            Personality Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {result.hollandCodes.map((code) => (
              <HollandBadge key={code} code={code} />
            ))}
          </div>
          <MBTIBadge type={result.mbtiType} />
        </CardContent>
      </Card>

      {/* Big Five */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider">
            Big Five (OCEAN)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.entries(result.bigFive) as [keyof typeof BIG_FIVE_LABELS, number][]).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--secondary-foreground)]">{BIG_FIVE_LABELS[key]}</span>
                <span className="text-[var(--foreground)] font-medium">{value}%</span>
              </div>
              <Progress value={value} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Ikigai Quadrants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider">
            Ikigai Quadrants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "What you love", items: result.ikigaiQuadrants.love, color: "var(--accent)" },
              { label: "What you're good at", items: result.ikigaiQuadrants.goodAt, color: "var(--primary)" },
              { label: "World needs", items: result.ikigaiQuadrants.worldNeeds, color: "#22c55e" },
              { label: "Paid for", items: result.ikigaiQuadrants.paidFor, color: "#f59e0b" },
            ].map((quad) => (
              <div key={quad.label} className="rounded-lg p-3" style={{ background: `${quad.color}15`, border: `1px solid ${quad.color}30` }}>
                <p className="text-xs font-medium mb-2" style={{ color: quad.color }}>{quad.label}</p>
                <div className="flex flex-wrap gap-1">
                  {quad.items.slice(0, 3).map((item) => (
                    <span key={item} className="text-xs bg-[var(--muted)] text-[var(--secondary-foreground)] px-1.5 py-0.5 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {result.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider">
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.insights.map((insight, i) => (
              <div key={i} className="flex gap-2 text-sm text-[var(--secondary-foreground)]">
                <span className="text-[var(--primary)] mt-0.5">✦</span>
                <span>{insight}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
