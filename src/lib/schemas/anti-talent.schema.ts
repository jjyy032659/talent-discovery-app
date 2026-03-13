import { z } from "zod";

export const AntiTalentResultSchema = z.object({
  patterns: z.array(z.string()),
  hiddenStrengths: z.array(z.object({
    strength: z.string(),
    confidence: z.number().min(0).max(100),
    rationale: z.string(),
  })),
  avoidanceDimensions: z.array(z.string()),
  redirectSuggestion: z.string(),
});

export type AntiTalentOutput = z.infer<typeof AntiTalentResultSchema>;
