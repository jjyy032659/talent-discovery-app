import { z } from "zod";

const CompetencyScoreSchema = z.object({
  creativity: z.number().min(0).max(10).optional(),
  leadership: z.number().min(0).max(10).optional(),
  analyticalThinking: z.number().min(0).max(10).optional(),
  empathy: z.number().min(0).max(10).optional(),
  communication: z.number().min(0).max(10).optional(),
  execution: z.number().min(0).max(10).optional(),
  vision: z.number().min(0).max(10).optional(),
  technicalAptitude: z.number().min(0).max(10).optional(),
});

export const ScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  narrative: z.string(),
  context: z.string(),
  choices: z.array(z.object({
    id: z.string(),
    text: z.string(),
    reasoning: z.string(),
    scores: CompetencyScoreSchema,
  })).min(3).max(4),
});

export const TaskCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(["technical", "creative", "social", "analytical", "operational", "strategic"]),
  icon: z.string(),
});

export const TaskDeckSchema = z.object({
  tasks: z.array(TaskCardSchema),
});

export type ScenarioOutput = z.infer<typeof ScenarioSchema>;
export type TaskDeckOutput = z.infer<typeof TaskDeckSchema>;
