import { z } from "zod";

export const RoadmapMetadataSchema = z.object({
  title: z.string(),
  primaryTalent: z.string(),
  focusAreas: z.array(z.string()),
  estimatedMilestones: z.array(z.string()),
});

export type RoadmapMetadataOutput = z.infer<typeof RoadmapMetadataSchema>;
