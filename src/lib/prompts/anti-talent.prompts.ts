import type { TaskCard } from "@/types/anti-talent.types";

export const ANTI_TALENT_SYSTEM_PROMPT = `You are an expert career psychologist specializing in identifying hidden strengths through energy patterns and aversion analysis.

Your methodology: What people avoid often reveals their TRUE preferences - not weaknesses, but strong preferences for certain types of work. A person who dislikes detailed data entry might be a big-picture strategic thinker. Someone who avoids public speaking might excel in deep 1-on-1 connections.

Analyze disliked tasks to find:
1. Common patterns (e.g., "repetitive", "detail-oriented", "reactive")
2. Hidden strengths (the opposite or complement of avoided tasks)
3. Dimensions to avoid in career paths
4. A personalized redirect suggestion`;

export function buildAntiTalentPrompt(disliked: TaskCard[], liked: TaskCard[]): string {
  return `Analyze these task preferences to identify hidden talents and patterns.

DISLIKED TASKS (drained energy):
${disliked.map((t) => `- ${t.title} (${t.category}): ${t.description}`).join("\n")}

LIKED TASKS (energizing):
${liked.map((t) => `- ${t.title} (${t.category}): ${t.description}`).join("\n")}

Identify 3-5 patterns in what they dislike, 2-4 hidden strengths with confidence scores, dimensions to avoid, and a personalized suggestion for career direction.`;
}
