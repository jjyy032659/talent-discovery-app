"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MarkdownContent } from "@/components/shared/MarkdownContent";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface RoadmapRendererProps {
  markdown: string;
  isStreaming: boolean;
}

export function RoadmapRenderer({ markdown, isStreaming }: RoadmapRendererProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [markdown, isStreaming]);

  return (
    <div className="relative">
      <MarkdownContent content={markdown} className="text-sm" />
      {isStreaming && (
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="inline-flex items-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]"
        >
          <LoadingSpinner size="sm" />
          Generating your roadmap...
        </motion.div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
