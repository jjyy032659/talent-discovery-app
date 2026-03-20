"use server";

import { headers } from "next/headers";
import { analyzeIkigai } from "./ikigai.actions";
import type { IkigaiMessage, IkigaiAnalysisResult } from "@/types/ikigai.types";

// In-memory rate limiter — resets on server restart, fine for a demo
// Map<ip, { count: number; resetAt: number }>
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 15;                   // max calls per window per IP
const RATE_WINDOW_MS = 60 * 60 * 1000;  // 1 hour window

function isAllowed(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function analyzeDemoIkigai(
  conversationHistory: IkigaiMessage[],
  currentInput: string
): Promise<{ success: true; data: IkigaiAnalysisResult } | { success: false; error: string }> {
  const headersList = await headers();
  // nginx sets x-forwarded-for; fall back to "unknown" in dev
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!isAllowed(ip)) {
    return { success: false, error: "RATE_LIMITED" };
  }

  return analyzeIkigai(conversationHistory, currentInput);
}
