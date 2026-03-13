import type { Competency } from "./talent-profile.types";

export interface ScenarioChoice {
  id: string;
  text: string;
  reasoning: string;
  scores: Partial<Record<Competency, number>>;
}

export interface ScenarioData {
  id: string;
  title: string;
  narrative: string;
  context: string;
  choices: ScenarioChoice[];
}

export interface ScenarioResponse {
  scenarioId: string;
  choiceId: string;
  scores: Partial<Record<Competency, number>>;
}

export interface ScenarioSessionResult {
  competencyScores: Record<Competency, number>;
  topCompetencies: Competency[];
  narrative: string;
  feedbackPoints: string[];
}
