export interface GoalStep {
  id: string;
  label: string;
  notes?: string;
  idealFinish?: string;     // "2026-04-01" or "2026-04" or "March 2026" or "ongoing"
  estimatedTime?: string;   // "2 hours", "30 min", "ongoing", "milestone"
  links?: string[];
}

export interface GoalDefinition {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  priority: "high" | "medium" | "low";
  steps: GoalStep[];
}
