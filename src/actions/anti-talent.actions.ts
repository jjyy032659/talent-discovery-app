"use server";

import { z } from "zod";
import { getGeminiClient, DEFAULT_MODEL } from "@/lib/gemini";
import { AntiTalentResultSchema } from "@/lib/schemas/anti-talent.schema";
import { ANTI_TALENT_SYSTEM_PROMPT, buildAntiTalentPrompt } from "@/lib/prompts/anti-talent.prompts";
import type { TaskCard, AntiTalentResult } from "@/types/anti-talent.types";

export async function analyzeAntiTalent(
  dislikedTasks: TaskCard[],
  likedTasks: TaskCard[]
): Promise<{ success: true; data: AntiTalentResult } | { success: false; error: string }> {
  try {
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: buildAntiTalentPrompt(dislikedTasks, likedTasks),
      config: {
        systemInstruction: ANTI_TALENT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: z.toJSONSchema(AntiTalentResultSchema),
      },
    });

    const text = response.text ?? "{}";
    const parsed = AntiTalentResultSchema.parse(JSON.parse(text));
    return { success: true, data: parsed as AntiTalentResult };
  } catch (err) {
    console.error("analyzeAntiTalent error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Analysis failed" };
  }
}
