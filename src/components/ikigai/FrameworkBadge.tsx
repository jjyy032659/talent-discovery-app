import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HOLLAND_LABELS, MBTI_DESCRIPTIONS, type HollandCode } from "@/types/ikigai.types";

interface HollandBadgeProps {
  code: HollandCode;
}

export function HollandBadge({ code }: HollandBadgeProps) {
  const colors: Record<HollandCode, string> = {
    R: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    I: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    A: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    S: "bg-green-500/20 text-green-400 border-green-500/30",
    E: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    C: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border", colors[code])}>
      {code} · {HOLLAND_LABELS[code]}
    </span>
  );
}

interface MBTIBadgeProps {
  type: string;
}

export function MBTIBadge({ type }: MBTIBadgeProps) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-lg font-bold text-[var(--primary)]">{type}</span>
      <span className="text-xs text-[var(--muted-foreground)]">{MBTI_DESCRIPTIONS[type] ?? ""}</span>
    </div>
  );
}
