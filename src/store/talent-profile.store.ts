import { create } from "zustand";
import { DEFAULT_DIMENSIONS, type TalentDimension } from "@/types/talent-profile.types";

interface TalentProfileState {
  dimensions: TalentDimension[];
  topTalents: string[];
  avoidanceAreas: string[];
  profileComplete: boolean;
  lastUpdated: string | null;

  setProfile: (profile: Partial<TalentProfileState>) => void;
  updateFromIkigai: (bigFive: Record<string, number>) => void;
  updateFromScenario: (competencyScores: Record<string, number>) => void;
  updateFromAntiTalent: (avoidance: string[], strengths: string[]) => void;
  getDimensionScore: (key: string) => number;
}

export const useTalentProfileStore = create<TalentProfileState>()((set, get) => ({
  dimensions: DEFAULT_DIMENSIONS.map((d) => ({ ...d })),
  topTalents: [],
  avoidanceAreas: [],
  profileComplete: false,
  lastUpdated: null,

  // Hydrates the store from DynamoDB data (called on dashboard mount)
  setProfile: (profile) => set((state) => ({ ...state, ...profile })),

  updateFromIkigai: (bigFive) =>
    set((state) => {
      const dims = state.dimensions.map((d) => {
        let score = d.score;
        // Map Big Five traits to talent dimensions
        switch (d.key) {
          case "creativity":
            score = Math.max(score, bigFive.openness ?? 0);
            break;
          case "empathy":
            score = Math.max(score, bigFive.agreeableness ?? 0);
            break;
          case "execution":
            score = Math.max(score, bigFive.conscientiousness ?? 0);
            break;
          case "communication":
            score = Math.max(score, bigFive.extraversion ?? 0);
            break;
          case "leadership":
            score = Math.max(score, ((bigFive.extraversion ?? 0) + (bigFive.conscientiousness ?? 0)) / 2);
            break;
        }
        return { ...d, score: Math.round(score) };
      });
      const topTalents = dims
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((d) => d.label);
      return { dimensions: dims, topTalents, lastUpdated: new Date().toISOString() };
    }),

  updateFromScenario: (competencyScores) =>
    set((state) => {
      const maxScore = Math.max(...Object.values(competencyScores), 1);
      const dims = state.dimensions.map((d) => {
        const scenarioScore = competencyScores[d.key] ?? 0;
        const normalized = (scenarioScore / maxScore) * 100;
        const score = d.score > 0 ? Math.round((d.score + normalized) / 2) : Math.round(normalized);
        return { ...d, score };
      });
      const topTalents = [...dims].sort((a, b) => b.score - a.score).slice(0, 3).map((d) => d.label);
      return { dimensions: dims, topTalents, profileComplete: true, lastUpdated: new Date().toISOString() };
    }),

  updateFromAntiTalent: (avoidance, strengths) =>
    set((state) => {
      const dims = state.dimensions.map((d) => {
        const isStrength = strengths.some((s) => s.toLowerCase().includes(d.key.toLowerCase()));
        const score = isStrength ? Math.min(100, d.score + 15) : d.score;
        return { ...d, score };
      });
      return { dimensions: dims, avoidanceAreas: avoidance, lastUpdated: new Date().toISOString() };
    }),

  getDimensionScore: (key) => {
    const dim = get().dimensions.find((d) => d.key === key);
    return dim?.score ?? 0;
  },
}));
