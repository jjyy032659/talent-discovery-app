"use server";

import { z } from "zod";
import { getGeminiClient, DEFAULT_MODEL } from "@/lib/gemini";
import { ScenarioSchema, TaskDeckSchema } from "@/lib/schemas/scenario.schema";
import { SCENARIO_SYSTEM_PROMPT, buildScenarioPrompt, TASK_DECK_PROMPT } from "@/lib/prompts/scenario.prompts";
import type { ScenarioData } from "@/types/scenario.types";
import type { TaskCard } from "@/types/anti-talent.types";

export async function generateScenario(
  completedScenarioIds: string[]
): Promise<{ success: true; data: ScenarioData } | { success: false; error: string }> {
  try {
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: buildScenarioPrompt(completedScenarioIds),
      config: {
        systemInstruction: SCENARIO_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: z.toJSONSchema(ScenarioSchema),
      },
    });

    const text = response.text ?? "{}";
    const parsed = ScenarioSchema.parse(JSON.parse(text));
    return { success: true, data: parsed as ScenarioData };
  } catch (err) {
    console.error("generateScenario error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}

export async function generateTaskDeck(): Promise<
  { success: true; data: TaskCard[] } | { success: false; error: string }
> {
  try {
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: TASK_DECK_PROMPT,
      config: {
        responseMimeType: "application/json",
        responseSchema: z.toJSONSchema(TaskDeckSchema),
      },
    });

    const text = response.text ?? "{}";
    const parsed = TaskDeckSchema.parse(JSON.parse(text));
    return { success: true, data: parsed.tasks as TaskCard[] };
  } catch (err) {
    console.error("generateTaskDeck error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}
