"use server";

import { z } from "zod";
import { getGeminiClient, DEFAULT_MODEL } from "@/lib/gemini";
import { RoadmapMetadataSchema } from "@/lib/schemas/roadmap.schema";
import type { TalentProfile } from "@/types/talent-profile.types";
import type { RoadmapMetadata } from "@/types/roadmap.types";

export async function getRoadmapMetadata(
  profile: Partial<TalentProfile>
): Promise<{ success: true; data: RoadmapMetadata } | { success: false; error: string }> {
  try {
    const ai = getGeminiClient();
    const topTalent = profile.topTalents?.[0] ?? "your primary talent";
    const dimensions = profile.dimensions
      ?.filter((d) => d.score > 40)
      .map((d) => `${d.label}: ${d.score}/100`)
      .join(", ");

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Generate roadmap metadata for someone with primary talent: "${topTalent}". Their strengths: ${dimensions ?? "creative thinking"}. Provide a compelling title, 3-5 focus areas, and 4-5 milestone descriptions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: z.toJSONSchema(RoadmapMetadataSchema),
      },
    });

    const text = response.text ?? "{}";
    const parsed = RoadmapMetadataSchema.parse(JSON.parse(text));
    return { success: true, data: parsed as RoadmapMetadata };
  } catch (err) {
    console.error("getRoadmapMetadata error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to get metadata" };
  }
}
