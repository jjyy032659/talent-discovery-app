import { getGeminiClient, DEFAULT_MODEL } from "@/lib/gemini";
import { buildRoadmapPrompt, ROADMAP_SYSTEM_PROMPT } from "@/lib/prompts/roadmap.prompts";
import type { TalentProfile } from "@/types/talent-profile.types";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      profile: Partial<TalentProfile>;
      ikigaiSummary?: string;
    };

    const ai = getGeminiClient();
    const prompt = buildRoadmapPrompt(body.profile, body.ikigaiSummary);

    const stream = await ai.models.generateContentStream({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: ROADMAP_SYSTEM_PROMPT,
      },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Roadmap stream error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Stream failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
