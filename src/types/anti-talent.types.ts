export type TaskCategory = "technical" | "creative" | "social" | "analytical" | "operational" | "strategic";

export interface TaskCard {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  icon: string;
}

export interface HiddenStrength {
  strength: string;
  confidence: number;
  rationale: string;
}

export interface AntiTalentResult {
  patterns: string[];
  hiddenStrengths: HiddenStrength[];
  avoidanceDimensions: string[];
  redirectSuggestion: string;
}
