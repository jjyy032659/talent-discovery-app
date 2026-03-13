"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TalentDimension } from "@/types/talent-profile.types";

interface TalentRadarChartProps {
  dimensions: TalentDimension[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label: string; description: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-[var(--foreground)] mb-1">{d.payload.label}</p>
      <p className="text-[var(--primary)]">{d.value}/100</p>
      <p className="text-[var(--muted-foreground)] mt-1 max-w-[160px]">{d.payload.description}</p>
    </div>
  );
}

export function TalentRadarChart({ dimensions }: TalentRadarChartProps) {
  const data = dimensions.map((d) => ({
    label: d.label,
    score: d.score,
    description: d.description,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <RadarChart data={data} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
        <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
          axisLine={false}
        />
        <Radar
          name="Talent Score"
          dataKey="score"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
