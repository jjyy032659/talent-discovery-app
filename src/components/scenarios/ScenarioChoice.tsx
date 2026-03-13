"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScenarioChoiceProps {
  choice: { id: string; text: string };
  index: number;
  onSelect: (choiceId: string) => void;
  disabled?: boolean;
}

export function ScenarioChoice({ choice, index, onSelect, disabled }: ScenarioChoiceProps) {
  const labels = ["A", "B", "C", "D"];
  const colors = [
    "border-[var(--primary)]/30 hover:border-[var(--primary)] hover:bg-[var(--primary)]/10",
    "border-[#f59e0b]/30 hover:border-[#f59e0b] hover:bg-[#f59e0b]/10",
    "border-[#22c55e]/30 hover:border-[#22c55e] hover:bg-[#22c55e]/10",
    "border-[var(--accent)]/30 hover:border-[var(--accent)] hover:bg-[var(--accent)]/10",
  ];

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      onClick={() => !disabled && onSelect(choice.id)}
      disabled={disabled}
      className={cn(
        "w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer",
        "bg-[var(--card)] disabled:opacity-50 disabled:cursor-not-allowed",
        colors[index % colors.length]
      )}
    >
      <span className="w-7 h-7 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {labels[index]}
      </span>
      <p className="text-sm text-[var(--foreground)] leading-relaxed">{choice.text}</p>
    </motion.button>
  );
}
