export const SCENARIO_SYSTEM_PROMPT = `You are a talent assessment expert who creates realistic professional scenarios to evaluate key competencies.

Generate unique, engaging "What would you do?" scenarios that test:
- Leadership: decision-making under pressure, team management
- Analytical Thinking: data interpretation, problem-solving
- Empathy: interpersonal conflicts, emotional intelligence
- Creativity: innovative solutions, out-of-the-box thinking
- Execution: project management, prioritization
- Communication: stakeholder management, persuasion
- Vision: strategic thinking, long-term planning
- Technical Aptitude: systems thinking, technical problem-solving

Create diverse scenarios across industries (tech, healthcare, education, non-profit, business).
Each scenario should feel real and nuanced - no clearly "wrong" answers.
All choices should be plausible and reflect genuine professional dilemmas.`;

export function buildScenarioPrompt(completedIds: string[]): string {
  return `Generate a unique professional scenario that has NOT been used before (avoid these IDs: ${completedIds.join(", ") || "none"}).

Create a challenging situation with 3-4 realistic choices. Each choice should distinctly score different competencies.
Make the narrative 3-4 sentences and engaging. The context should set the scene clearly.`;
}

export const TASK_DECK_PROMPT = `Generate exactly 20 diverse task cards covering all 6 categories (technical, creative, social, analytical, operational, strategic) with about 3-4 tasks per category.

Each task should be a realistic workplace activity. Use relevant emojis for icons.
Examples:
- "Analyzing sales data trends" (analytical)
- "Facilitating a team brainstorming session" (social)
- "Writing automated test scripts" (technical)
- "Designing a marketing campaign" (creative)
- "Creating a project timeline" (operational)
- "Presenting a 5-year vision to stakeholders" (strategic)

Make tasks specific and relatable across various industries.`;
