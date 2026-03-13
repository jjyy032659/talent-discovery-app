import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ScenarioData, ScenarioResponse, ScenarioSessionResult } from "@/types/scenario.types";
import type { Competency } from "@/types/talent-profile.types";

interface ScenarioState {
  currentScenario: ScenarioData | null;
  completedScenarios: string[];
  responses: ScenarioResponse[];
  competencyScores: Record<Competency, number>;
  isGenerating: boolean;
  sessionComplete: boolean;
  sessionResult: ScenarioSessionResult | null;

  setCurrentScenario: (s: ScenarioData) => void;
  addResponse: (r: ScenarioResponse) => void;
  setGenerating: (v: boolean) => void;
  completeSession: (result: ScenarioSessionResult) => void;
  reset: () => void;
}

const defaultScores: Record<Competency, number> = {
  creativity: 0,
  leadership: 0,
  analyticalThinking: 0,
  empathy: 0,
  communication: 0,
  execution: 0,
  vision: 0,
  technicalAptitude: 0,
};

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set) => ({
      currentScenario: null,
      completedScenarios: [],
      responses: [],
      competencyScores: { ...defaultScores },
      isGenerating: false,
      sessionComplete: false,
      sessionResult: null,

      setCurrentScenario: (s) =>
        set({ currentScenario: s, isGenerating: false }),

      addResponse: (r) =>
        set((state) => {
          const newScores = { ...state.competencyScores };
          for (const [key, val] of Object.entries(r.scores)) {
            const k = key as Competency;
            newScores[k] = (newScores[k] ?? 0) + (val ?? 0);
          }
          return {
            responses: [...state.responses, r],
            competencyScores: newScores,
            completedScenarios: [...state.completedScenarios, r.scenarioId],
          };
        }),

      setGenerating: (v) => set({ isGenerating: v }),

      completeSession: (result) =>
        set({ sessionComplete: true, sessionResult: result }),

      reset: () =>
        set({
          currentScenario: null,
          completedScenarios: [],
          responses: [],
          competencyScores: { ...defaultScores },
          isGenerating: false,
          sessionComplete: false,
          sessionResult: null,
        }),
    }),
    {
      name: "scenario-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
