import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { IkigaiMessage, IkigaiAnalysisResult, IkigaiPhase } from "@/types/ikigai.types";

interface IkigaiState {
  messages: IkigaiMessage[];
  isAnalyzing: boolean;
  currentPhase: IkigaiPhase;
  analysisResult: IkigaiAnalysisResult | null;

  addMessage: (msg: Omit<IkigaiMessage, "timestamp">) => void;
  setAnalyzing: (v: boolean) => void;
  setAnalysisResult: (result: IkigaiAnalysisResult) => void;
  reset: () => void;
}

const initialState = {
  messages: [] as IkigaiMessage[],
  isAnalyzing: false,
  currentPhase: "loves" as IkigaiPhase,
  analysisResult: null as IkigaiAnalysisResult | null,
};

export const useIkigaiStore = create<IkigaiState>()(
  persist(
    (set) => ({
      ...initialState,

      addMessage: (msg) =>
        set((state) => ({
          messages: [...state.messages, { ...msg, timestamp: new Date() }],
        })),

      setAnalyzing: (v) => set({ isAnalyzing: v }),

      setAnalysisResult: (result) =>
        set({
          analysisResult: result,
          currentPhase: result.conversationPhase,
        }),

      reset: () => set(initialState),
    }),
    {
      name: "ikigai-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
