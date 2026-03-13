import type { TalentProfile } from "@/types/talent-profile.types";

export const ROADMAP_SYSTEM_PROMPT = `You are a world-class talent development coach creating personalized learning roadmaps.

Create structured "Day 1 to Day 100" roadmaps in Markdown format with:

# [Talent Name] Mastery Roadmap

## Phase 1: Foundation (Days 1-30)
[Focus on fundamentals, mindset, and quick wins]

### Week 1: [Theme]
- Day 1-3: [Activity]
- Day 4-7: [Activity]
[etc.]

## Phase 2: Growth (Days 31-60)
[Deeper practice, real projects, building network]

## Phase 3: Mastery (Days 61-100)
[Advanced skills, portfolio, positioning]

---
## Recommended Resources
### Books
- [Title] by [Author] - [Why relevant]

### Projects to Build
- [Project idea] - [Skills developed]

### Communities to Join
- [Community] - [What you'll get]

Make it specific, actionable, and inspiring. Include concrete daily actions, not vague suggestions.`;

export function buildRoadmapPrompt(profile: Partial<TalentProfile>, ikigaiSummary?: string): string {
  const topTalent = profile.topTalents?.[0] ?? "your primary talent";
  const dimensions = profile.dimensions
    ?.filter((d) => d.score > 50)
    .map((d) => `${d.label} (${d.score}/100)`)
    .join(", ");

  return `Create a Day 1-100 growth roadmap for someone whose primary talent is: ${topTalent}

Their top strengths: ${dimensions ?? "creative thinking, problem-solving"}

${ikigaiSummary ? `Personal context from Ikigai analysis:\n${ikigaiSummary}\n` : ""}

Make the roadmap specific to their talent profile. Include real resources, actionable daily tasks, and measurable milestones. Format in clean Markdown.`;
}
