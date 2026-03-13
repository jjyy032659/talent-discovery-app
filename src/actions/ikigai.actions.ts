"use server";

import { z } from "zod";
import { getGeminiClient, DEFAULT_MODEL } from "@/lib/gemini";
import { IkigaiAnalysisSchema } from "@/lib/schemas/ikigai.schema";
import { IKIGAI_SYSTEM_PROMPT, buildIkigaiMessages } from "@/lib/prompts/ikigai.prompts";
import type { IkigaiMessage, IkigaiAnalysisResult } from "@/types/ikigai.types";

export async function analyzeIkigai(
  conversationHistory: IkigaiMessage[],
  currentInput: string
): Promise<{ success: true; data: IkigaiAnalysisResult } | { success: false; error: string }> {
  try {
    const ai = getGeminiClient();
    const history = buildIkigaiMessages(conversationHistory, currentInput);

    // Map to Gemini content format (assistant → model)
    const contents = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction: IKIGAI_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: z.toJSONSchema(IkigaiAnalysisSchema),
      },
    });

    const text = response.text ?? "{}";
    const parsed = IkigaiAnalysisSchema.parse(JSON.parse(text));
    return { success: true, data: parsed as IkigaiAnalysisResult };
  } catch (err) {
    console.error("analyzeIkigai error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Analysis failed" };
  }
}
