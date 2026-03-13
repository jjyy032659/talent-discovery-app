export type Competency =
  | "creativity"
  | "leadership"
  | "analyticalThinking"
  | "empathy"
  | "communication"
  | "execution"
  | "vision"
  | "technicalAptitude";

export interface TalentDimension {
  key: Competency;
  label: string;
  score: number; // 0-100
  description: string;
}

export interface TalentProfile {
  dimensions: TalentDimension[];
  topTalents: string[];
  avoidanceAreas: string[];
  profileComplete: boolean;
  lastUpdated: Date | null;
}

export const COMPETENCY_LABELS: Record<Competency, string> = {
  creativity: "Creativity",
  leadership: "Leadership",
  analyticalThinking: "Analytical",
  empathy: "Empathy",
  communication: "Communication",
  execution: "Execution",
  vision: "Vision",
  technicalAptitude: "Technical",
};

export const DEFAULT_DIMENSIONS: TalentDimension[] = [
  { key: "creativity", label: "Creativity", score: 0, description: "Ability to generate novel ideas and solutions" },
  { key: "leadership", label: "Leadership", score: 0, description: "Capacity to inspire and guide others" },
  { key: "analyticalThinking", label: "Analytical", score: 0, description: "Skill in breaking down complex problems" },
  { key: "empathy", label: "Empathy", score: 0, description: "Understanding and connecting with others" },
  { key: "communication", label: "Communication", score: 0, description: "Expressing ideas clearly and persuasively" },
  { key: "execution", label: "Execution", score: 0, description: "Turning plans into results efficiently" },
  { key: "vision", label: "Vision", score: 0, description: "Seeing the big picture and future possibilities" },
  { key: "technicalAptitude", label: "Technical", score: 0, description: "Proficiency with tools, systems, and technology" },
];
