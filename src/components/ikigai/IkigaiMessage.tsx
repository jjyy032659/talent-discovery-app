import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IkigaiMessage as IkigaiMessageType } from "@/types/ikigai.types";

interface IkigaiMessageProps {
  message: IkigaiMessageType;
  index: number;
}

export function IkigaiMessage({ message, index }: IkigaiMessageProps) {
  const isAssistant = message.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn("flex gap-3", isAssistant ? "flex-row" : "flex-row-reverse")}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
          isAssistant
            ? "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]"
            : "bg-[var(--muted)]"
        )}
      >
        {isAssistant ? (
          <Sparkles className="w-4 h-4 text-white" />
        ) : (
          <User className="w-4 h-4 text-[var(--muted-foreground)]" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isAssistant
            ? "bg-[var(--secondary)] text-[var(--foreground)] rounded-tl-sm"
            : "bg-[var(--primary)] text-white rounded-tr-sm"
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}
