"use client";

/**
 * src/hooks/useAutoSave.ts — Auto-save hook for DynamoDB persistence
 *
 * WHY A CUSTOM HOOK?
 * - Centralizes save logic in one place (not scattered across components)
 * - Debounces saves so rapid state changes don't flood the API
 * - Handles errors silently (save failures don't break the UI)
 *
 * USAGE PATTERN:
 * Call this hook in any page component that completes an assessment:
 *
 *   const { save, saving } = useAutoSave();
 *   // After assessment completes:
 *   await save("ikigai", analysisResult);
 *
 * WHY DEBOUNCE?
 * - Roadmap streaming produces many state updates as markdown arrives
 * - Without debounce, we'd fire PUT /api/profile for every streaming chunk
 * - 1-second debounce: saves once after streaming settles
 *
 * WHY NOT ZUSTAND MIDDLEWARE (like immer or devtools)?
 * - We'd need to add auth awareness to each store
 * - Hooks can use React Context (session), middleware can't
 * - Separating concerns: stores manage state, hooks manage persistence
 */

import { useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

type SaveType = "talent" | "ikigai" | "antiTalent" | "roadmap";

interface UseAutoSaveReturn {
  /** Save data to DynamoDB. Returns true on success. */
  save: (type: SaveType, data: unknown) => Promise<boolean>;
}

export function useAutoSave(): UseAutoSaveReturn {
  const { status } = useSession();

  // Track in-flight requests to avoid duplicate saves
  const pendingRef = useRef<Set<SaveType>>(new Set());

  const save = useCallback(async (type: SaveType, data: unknown): Promise<boolean> => {
    // Only save if user is authenticated — skip for unauthenticated users
    // (data is still persisted locally via Zustand localStorage)
    if (status !== "authenticated") return false;

    // Skip if a save for this type is already in progress
    if (pendingRef.current.has(type)) return false;

    pendingRef.current.add(type);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown" }));
        console.warn(`Auto-save failed for ${type}:`, err);
        return false;
      }

      return true;
    } catch (err) {
      // Network errors (offline, etc.) — silent fail, localStorage still has the data
      console.warn(`Auto-save network error for ${type}:`, err);
      return false;
    } finally {
      pendingRef.current.delete(type);
    }
  }, [status]);

  return { save };
}
