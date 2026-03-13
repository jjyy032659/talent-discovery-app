import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RoadmapMetadata } from "@/types/roadmap.types";

interface RoadmapState {
  rawMarkdown: string;
  isStreaming: boolean;
  streamComplete: boolean;
  metadata: RoadmapMetadata | null;
  generatedAt: string | null;

  appendMarkdown: (chunk: string) => void;
  setContent: (markdown: string) => void;
  setStreaming: (v: boolean) => void;
  setStreamComplete: () => void;
  setMetadata: (meta: RoadmapMetadata) => void;
  reset: () => void;
}

export const useRoadmapStore = create<RoadmapState>()(
  persist(
    (set) => ({
      rawMarkdown: "",
      isStreaming: false,
      streamComplete: false,
      metadata: null,
      generatedAt: null,

      appendMarkdown: (chunk) =>
        set((state) => ({ rawMarkdown: state.rawMarkdown + chunk })),

      // Replaces entire markdown content (used when hydrating from DynamoDB)
      setContent: (markdown) => set({ rawMarkdown: markdown, streamComplete: true }),

      setStreaming: (v) => set({ isStreaming: v, ...(v ? { rawMarkdown: "" } : {}) }),

      setStreamComplete: () =>
        set({ isStreaming: false, streamComplete: true, generatedAt: new Date().toISOString() }),

      setMetadata: (meta) => set({ metadata: meta }),

      reset: () =>
        set({
          rawMarkdown: "",
          isStreaming: false,
          streamComplete: false,
          metadata: null,
          generatedAt: null,
        }),
    }),
    {
      name: "roadmap-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
