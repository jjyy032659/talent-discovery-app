"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IkigaiMessage } from "./IkigaiMessage";
import { IkigaiResultCard } from "./IkigaiResultCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useIkigaiStore } from "@/store/ikigai.store";
import { useTalentProfileStore } from "@/store/talent-profile.store";
import { analyzeIkigai } from "@/actions/ikigai.actions";
import toast from "react-hot-toast";

const INITIAL_PROMPT = "Hi! I'm here to help you discover your Ikigai — your unique reason for being. Let's start with what excites you most in life. What activities, topics, or ideas make you lose track of time? Tell me in your own words — there are no wrong answers here.";

export function IkigaiChat() {
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, analysisResult, addMessage, setAnalyzing, setAnalysisResult, reset } = useIkigaiStore();
  const { updateFromIkigai } = useTalentProfileStore();

  // Add initial greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({ role: "assistant", content: INITIAL_PROMPT });
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || isPending) return;
    const userInput = input.trim();
    setInput("");
    addMessage({ role: "user", content: userInput });
    setAnalyzing(true);

    startTransition(async () => {
      const result = await analyzeIkigai(messages, userInput);
      setAnalyzing(false);
      if (result.success) {
        setAnalysisResult(result.data);
        addMessage({ role: "assistant", content: result.data.nextPrompt });
        updateFromIkigai(result.data.bigFive as unknown as Record<string, number>);
      } else {
        toast.error(result.error ?? "Analysis failed");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="font-medium text-[var(--foreground)]">Conversation</h2>
          <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-[var(--muted-foreground)]">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" style={{ maxHeight: "calc(100vh - 320px)" }}>
          {messages.map((msg, i) => (
            <IkigaiMessage key={i} message={msg} index={i} />
          ))}
          {isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shrink-0">
                <LoadingSpinner size="sm" className="border-white border-t-transparent" />
              </div>
              <div className="bg-[var(--secondary)] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 rounded-full bg-[var(--primary)]"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts... (Enter to send, Shift+Enter for new line)"
              className="flex-1 min-h-[60px] max-h-[120px]"
              disabled={isPending}
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isPending}
              size="icon"
              className="shrink-0 h-[60px] w-[60px]"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="lg:w-80 xl:w-96 overflow-y-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
        <AnimatePresence mode="wait">
          {analysisResult ? (
            <IkigaiResultCard key="result" result={analysisResult} />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-center p-6 rounded-xl border border-dashed border-[var(--border)]"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-3">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">Analysis will appear here</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Share more about yourself to unlock your personality insights
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
