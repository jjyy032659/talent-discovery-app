"use client";

/**
 * src/app/(dashboard)/layout.tsx — Dashboard shell with auth guard + data hydration
 *
 * WHY "use client"?
 * - useState for mobile nav toggle
 * - useEffect for fetching user profile from DynamoDB on mount
 * - useSession for reading auth state
 *
 * WHY AUTH GUARD HERE (in addition to middleware)?
 * - Middleware redirects unauthenticated users at the edge (network layer)
 * - This component provides a second layer: if middleware somehow passes
 *   through, this component also handles the redirect
 * - More importantly: this is where we HYDRATE Zustand stores with
 *   DynamoDB data — we need the user's ID (from session) to query DynamoDB
 *
 * DATA HYDRATION STRATEGY:
 * 1. User signs in → JWT cookie set → middleware allows dashboard access
 * 2. Dashboard layout mounts → calls GET /api/profile (fetches all DynamoDB data)
 * 3. DynamoDB data → Zustand store actions → UI renders with previous session data
 * 4. User continues assessment → Zustand state updates → auto-saved to DynamoDB
 *
 * This way users can close the browser and resume exactly where they left off.
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useTalentProfileStore } from "@/store/talent-profile.store";
import { useIkigaiStore } from "@/store/ikigai.store";
import { useAntiTalentStore } from "@/store/anti-talent.store";
import { useRoadmapStore } from "@/store/roadmap.store";
import type { AllUserData } from "@/lib/db";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { status } = useSession();
  const router = useRouter();

  // Zustand store setters to hydrate from DynamoDB
  const setProfile = useTalentProfileStore((s) => s.setProfile);
  const setIkigaiResult = useIkigaiStore((s) => s.setAnalysisResult);
  const setAntiTalentResult = useAntiTalentStore((s) => s.setAnalysisResult);
  const setRoadmapContent = useRoadmapStore((s) => s.setContent);

  // ─── Auth Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      // Middleware should have caught this, but belt-and-suspenders approach
      router.push("/");
    }
  }, [status, router]);

  // ─── Hydrate Zustand from DynamoDB ────────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadUserData() {
      try {
        // GET /api/profile → DynamoDB QueryCommand → all user assessments
        const res = await fetch("/api/profile");
        if (!res.ok) {
          if (res.status === 401) router.push("/");
          return;
        }

        const data: AllUserData = await res.json();

        // Hydrate each store if data exists in DynamoDB.
        // If null → store keeps its localStorage state (Zustand persist).
        // This means: DynamoDB is the "source of truth" cross-device,
        //             localStorage is the "offline cache" on this device.
        if (data.talentProfile) {
          // lastUpdated from DynamoDB is stored as ISO string; cast via unknown
          // to avoid Date vs string mismatch (store uses string, type uses Date)
          setProfile(data.talentProfile as unknown as Parameters<typeof setProfile>[0]);
        }
        if (data.ikigai) {
          setIkigaiResult(data.ikigai);
        }
        if (data.antiTalent) {
          setAntiTalentResult(data.antiTalent);
        }
        if (data.roadmap) {
          setRoadmapContent(data.roadmap);
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
      } finally {
        setDataLoaded(true);
      }
    }

    loadUserData();
  }, [status, router, setProfile, setIkigaiResult, setAntiTalentResult, setRoadmapContent]);

  // Show spinner while session is loading
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render dashboard content for unauthenticated users
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar />
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Show loading state until DynamoDB data is fetched */}
          {!dataLoaded ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
