import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TaskCard, AntiTalentResult } from "@/types/anti-talent.types";

interface AntiTalentState {
  taskDeck: TaskCard[];
  likedTasks: TaskCard[];
  dislikedTasks: TaskCard[];
  currentCardIndex: number;
  analysisResult: AntiTalentResult | null;
  isAnalyzing: boolean;
  deckExhausted: boolean;

  setTaskDeck: (tasks: TaskCard[]) => void;
  swipeRight: (task: TaskCard) => void;
  swipeLeft: (task: TaskCard) => void;
  setAnalysisResult: (result: AntiTalentResult) => void;
  setAnalyzing: (v: boolean) => void;
  reset: () => void;
}

export const useAntiTalentStore = create<AntiTalentState>()(
  persist(
    (set) => ({
      taskDeck: [],
      likedTasks: [],
      dislikedTasks: [],
      currentCardIndex: 0,
      analysisResult: null,
      isAnalyzing: false,
      deckExhausted: false,

      setTaskDeck: (tasks) =>
        set({ taskDeck: tasks, currentCardIndex: 0, deckExhausted: false }),

      swipeRight: (task) =>
        set((state) => {
          const nextIndex = state.currentCardIndex + 1;
          return {
            likedTasks: [...state.likedTasks, task],
            currentCardIndex: nextIndex,
            deckExhausted: nextIndex >= state.taskDeck.length,
          };
        }),

      swipeLeft: (task) =>
        set((state) => {
          const nextIndex = state.currentCardIndex + 1;
          return {
            dislikedTasks: [...state.dislikedTasks, task],
            currentCardIndex: nextIndex,
            deckExhausted: nextIndex >= state.taskDeck.length,
          };
        }),

      setAnalysisResult: (result) => set({ analysisResult: result }),
      setAnalyzing: (v) => set({ isAnalyzing: v }),

      reset: () =>
        set({
          taskDeck: [],
          likedTasks: [],
          dislikedTasks: [],
          currentCardIndex: 0,
          analysisResult: null,
          isAnalyzing: false,
          deckExhausted: false,
        }),
    }),
    {
      name: "anti-talent-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
