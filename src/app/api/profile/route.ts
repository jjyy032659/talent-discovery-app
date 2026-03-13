/**
 * src/app/api/profile/route.ts — REST API for loading/saving user profile data
 *
 * WHY A DEDICATED API ROUTE (not Server Actions for everything)?
 *
 * Server Actions are great for form mutations but have limitations:
 * - Can't easily be called at page-load time without triggering a full rerender
 * - Not ideal for "load all data on mount" patterns in client components
 *
 * This API route serves TWO purposes:
 * 1. GET /api/profile — Called on dashboard load to hydrate all Zustand stores
 *    with data persisted in DynamoDB from previous sessions
 * 2. PUT /api/profile — Called when assessment results change, to save them
 *    to DynamoDB for persistence across devices/sessions
 *
 * WHY REST HERE INSTEAD OF tRPC/GraphQL?
 * - We have ~2 endpoints; tRPC/GraphQL adds complexity without benefit at this scale
 * - Standard fetch() works everywhere (Server Components, Client Components, middleware)
 * - Easy to test with curl or Postman
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  loadAllUserData,
  saveTalentProfile,
  saveIkigaiResult,
  saveAntiTalentResult,
  saveRoadmap,
} from "@/lib/db";
import type { TalentProfile } from "@/types/talent-profile.types";
import type { IkigaiAnalysisResult } from "@/types/ikigai.types";
import type { AntiTalentResult } from "@/types/anti-talent.types";

// ─── GET /api/profile ─────────────────────────────────────────────────────────
// Load all user data from DynamoDB → return as JSON
// Client calls this on mount to hydrate Zustand stores from previous sessions

export async function GET() {
  // auth() reads the JWT cookie → returns session or null
  const session = await auth();
  if (!session?.user?.id) {
    // 401 Unauthorized: client should redirect to sign-in
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const data = await loadAllUserData(session.user.id);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// ─── PUT /api/profile ─────────────────────────────────────────────────────────
// Save assessment results to DynamoDB
// Body: { type: "talent" | "ikigai" | "antiTalent" | "roadmap", data: <payload> }

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      type: "talent" | "ikigai" | "antiTalent" | "roadmap";
      data: unknown;
    };

    const userId = session.user.id;

    switch (body.type) {
      case "talent":
        await saveTalentProfile(userId, body.data as Partial<TalentProfile>);
        break;
      case "ikigai":
        await saveIkigaiResult(userId, body.data as IkigaiAnalysisResult);
        break;
      case "antiTalent":
        await saveAntiTalentResult(userId, body.data as AntiTalentResult);
        break;
      case "roadmap":
        await saveRoadmap(userId, body.data as string);
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
