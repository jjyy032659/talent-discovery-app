import { z } from "zod";

const HollandCodeEnum = z.enum(["R", "I", "A", "S", "E", "C"]);
const MBTIEnum = z.enum([
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
]);

export const IkigaiAnalysisSchema = z.object({
  bigFive: z.object({
    openness: z.number().min(0).max(100),
    conscientiousness: z.number().min(0).max(100),
    extraversion: z.number().min(0).max(100),
    agreeableness: z.number().min(0).max(100),
    neuroticism: z.number().min(0).max(100),
  }),
  hollandCodes: z.array(HollandCodeEnum).min(1).max(3),
  mbtiType: MBTIEnum,
  ikigaiQuadrants: z.object({
    love: z.array(z.string()),
    goodAt: z.array(z.string()),
    worldNeeds: z.array(z.string()),
    paidFor: z.array(z.string()),
  }),
  insights: z.array(z.string()).min(2).max(5),
  conversationPhase: z.enum(["loves", "skills", "experiences", "complete"]),
  nextPrompt: z.string(),
});

export type IkigaiAnalysisOutput = z.infer<typeof IkigaiAnalysisSchema>;
