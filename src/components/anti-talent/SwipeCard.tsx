"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskCard } from "@/types/anti-talent.types";

interface SwipeCardProps {
  task: TaskCard;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  technical: "#6c63ff",
  creative: "#ff6584",
  social: "#22c55e",
  analytical: "#f59e0b",
  operational: "#06b6d4",
  strategic: "#a78bfa",
};

export function SwipeCard({ task, onSwipeLeft, onSwipeRight, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const dislikeOpacity = useTransform(x, [-80, 0], [1, 0]);

  const color = CATEGORY_COLORS[task.category] ?? "#6c63ff";

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipeRight();
    } else if (info.offset.x < -100) {
      onSwipeLeft();
    }
  };

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 rounded-2xl border border-[var(--border)] bg-[var(--card)]"
        style={{ transform: "scale(0.95) translateY(10px)", zIndex: 0 }}
      />
    );
  }

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: 10 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileHover={{ cursor: "grab" }}
      whileDrag={{ cursor: "grabbing" }}
      className="absolute inset-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden select-none"
    >
      {/* Like indicator */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-green-500/20 border border-green-500/40 rounded-full px-4 py-2 rotate-12"
      >
        <ThumbsUp className="w-5 h-5 text-green-400" />
        <span className="text-green-400 font-bold text-sm">LIKE</span>
      </motion.div>

      {/* Dislike indicator */}
      <motion.div
        style={{ opacity: dislikeOpacity }}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-4 py-2 -rotate-12"
      >
        <ThumbsDown className="w-5 h-5 text-red-400" />
        <span className="text-red-400 font-bold text-sm">PASS</span>
      </motion.div>

      {/* Card content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4"
          style={{ background: `${color}20`, border: `2px solid ${color}30` }}
        >
          {task.icon}
        </div>
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{task.title}</h3>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xs">{task.description}</p>
        <div className="mt-4">
          <span
            className="text-xs font-medium px-3 py-1 rounded-full capitalize"
            style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
          >
            {task.category}
          </span>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Swipe left to pass</span>
        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Swipe right to like</span>
      </div>
    </motion.div>
  );
}
