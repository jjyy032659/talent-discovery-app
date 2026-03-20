"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, Sparkles, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IkigaiResultCard } from "@/components/ikigai/IkigaiResultCard";
import { analyzeDemoIkigai } from "@/actions/demo.actions";
import { signIn } from "next-auth/react";
import type { IkigaiMessage, IkigaiAnalysisResult } from "@/types/ikigai.types";

const INITIAL_MESSAGE: IkigaiMessage = {
  role: "assistant",
  content:
    "Hi! I'm here to help you discover your Ikigai — the intersection of what you love, what you're good at, what the world needs, and what you can be paid for.\n\nLet's start with what genuinely excites you. What activities or topics make you lose track of time?",
  timestamp: new Date(),
};

const MAX_DEMO_EXCHANGES = 6; // user turns before forcing sign-up

export function DemoIkigaiChat() {
  const [messages, setMessages] = useState<IkigaiMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<IkigaiAnalysisResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rateLimited, setRateLimited] = useState(false);
  const [userTurns, setUserTurns] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Count user turns (messages from user role)
  const hitLimit = userTurns >= MAX_DEMO_EXCHANGES;
  const isComplete = result?.conversationPhase === "complete" || hitLimit;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, result]);

  function handleSend() {
    const text = input.trim();
    if (!text || isPending || isComplete) return;

    const userMsg: IkigaiMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setUserTurns((n) => n + 1);

    startTransition(async () => {
      const res = await analyzeDemoIkigai(
        messages.filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0),
        text
      );

      if (!res.success) {
        if (res.error === "RATE_LIMITED") {
          setRateLimited(true);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Sorry, something went wrong. Please try again in a moment.",
              timestamp: new Date(),
            },
          ]);
        }
        return;
      }

      setResult(res.data);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.nextPrompt,
          timestamp: new Date(),
        },
      ]);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* ── Chat Panel ── */}
      <div
        className="flex flex-col rounded-2xl border overflow-hidden"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          minHeight: 420,
          maxHeight: 520,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--primary)20" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "var(--primary)" }} />
          </div>
          <span className="font-semibold text-sm">Ikigai Generator</span>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "var(--primary)15",
              color: "var(--primary)",
            }}
          >
            Demo
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                style={
                  msg.role === "user"
                    ? { background: "var(--primary)", color: "white" }
                    : {
                        background: "var(--muted)",
                        color: "var(--foreground)",
                      }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-4 py-2.5"
                style={{ background: "var(--muted)" }}
              >
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        background: "var(--muted-foreground)",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="p-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          {isComplete || rateLimited ? (
            <div
              className="text-center text-sm py-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              {rateLimited
                ? "Rate limit reached — sign in to continue."
                : "Sign in to save your results and access all 5 assessments."}
            </div>
          ) : (
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Share your thoughts..."
                rows={1}
                className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!input.trim() || isPending}
                className="rounded-xl px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Results Panel ── */}
      <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 520 }}>
        {result ? (
          <>
            <IkigaiResultCard result={result} />

            {/* Sign-up CTA */}
            {isComplete && (
              <div
                className="rounded-2xl border p-5 text-center space-y-3"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary)10, var(--accent)10)",
                  borderColor: "var(--primary)30",
                }}
              >
                <Lock
                  className="w-6 h-6 mx-auto"
                  style={{ color: "var(--primary)" }}
                />
                <p className="font-semibold text-[var(--foreground)]">
                  Save your results
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Sign in to persist your Ikigai profile, run all 5 assessments,
                  and generate your personalised Growth Roadmap.
                </p>
                <Button
                  className="w-full gap-2"
                  onClick={() => signIn("cognito", { redirectTo: "/dashboard" })}
                >
                  Sign in with Google <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() =>
                    signIn("cognito-email", { redirectTo: "/dashboard" })
                  }
                >
                  Sign in with Email
                </Button>
              </div>
            )}
          </>
        ) : (
          // Placeholder before first AI response
          <div
            className="flex-1 rounded-2xl border flex flex-col items-center justify-center gap-3 p-8 text-center"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              minHeight: 420,
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--primary)15" }}
            >
              <Sparkles
                className="w-7 h-7"
                style={{ color: "var(--primary)" }}
              />
            </div>
            <p
              className="font-medium"
              style={{ color: "var(--secondary-foreground)" }}
            >
              Your results will appear here
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Answer a few questions and AI will map your personality, Holland
              Codes, MBTI type, and Ikigai quadrants in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
