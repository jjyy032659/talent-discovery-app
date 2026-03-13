export type IkigaiPhase = "loves" | "skills" | "experiences" | "complete";

export interface IkigaiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface BigFiveScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export type HollandCode = "R" | "I" | "A" | "S" | "E" | "C";

export const HOLLAND_LABELS: Record<HollandCode, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

export const BIG_FIVE_LABELS: Record<keyof BigFiveScores, string> = {
  openness: "Openness",
  conscientiousness: "Conscientiousness",
  extraversion: "Extraversion",
  agreeableness: "Agreeableness",
  neuroticism: "Neuroticism",
};

export interface IkigaiQuadrants {
  love: string[];
  goodAt: string[];
  worldNeeds: string[];
  paidFor: string[];
}

export interface IkigaiAnalysisResult {
  bigFive: BigFiveScores;
  hollandCodes: HollandCode[];
  mbtiType: string;
  ikigaiQuadrants: IkigaiQuadrants;
  insights: string[];
  conversationPhase: IkigaiPhase;
  nextPrompt: string;
}

export const MBTI_DESCRIPTIONS: Record<string, string> = {
  INTJ: "The Architect",
  INTP: "The Thinker",
  ENTJ: "The Commander",
  ENTP: "The Debater",
  INFJ: "The Advocate",
  INFP: "The Mediator",
  ENFJ: "The Protagonist",
  ENFP: "The Campaigner",
  ISTJ: "The Logistician",
  ISFJ: "The Defender",
  ESTJ: "The Executive",
  ESFJ: "The Consul",
  ISTP: "The Virtuoso",
  ISFP: "The Adventurer",
  ESTP: "The Entrepreneur",
  ESFP: "The Entertainer",
};
