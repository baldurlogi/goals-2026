import type { ModuleId } from "@/features/modules/modules";
import type { AISignals } from "@/features/ai/aiSignals";

export type SuggestionModule = Extract<
  ModuleId,
  "goals" | "reading" | "nutrition" | "fitness" | "schedule" | "todos"
>;

export type SuggestionCandidate = {
  module: SuggestionModule;
  priority: number;
  action: string;
  reason: string;
  href: string;
  emoji: string;
};

function hasModule(signals: AISignals, module: ModuleId): boolean {
  return signals.modules.includes(module);
}

function dedupeByModule(
  items: SuggestionCandidate[],
): SuggestionCandidate[] {
  const seen = new Set<string>();
  const output: SuggestionCandidate[] = [];

  for (const item of items.sort((a, b) => b.priority - a.priority)) {
    if (seen.has(item.module)) continue;
    seen.add(item.module);
    output.push(item);
  }

  return output;
}

export function buildSuggestionCandidates(
  signals: AISignals,
): SuggestionCandidate[] {
  const items: SuggestionCandidate[] = [];

  if (hasModule(signals, "goals")) {
    if (signals.goals.count === 0) {
      items.push({
        module: "goals",
        priority: 100,
        action: "Create your first goal",
        reason: "A clear goal gives the rest of your dashboard direction.",
        href: "/app/goals",
        emoji: "🎯",
      });
    }

    if (signals.goals.overdueSteps > 0) {
      items.push({
        module: "goals",
        priority: 96,
        action: `Review ${signals.goals.overdueSteps} overdue goal step${
          signals.goals.overdueSteps === 1 ? "" : "s"
        }`,
        reason: "Clearing overdue steps reduces friction and gets momentum back.",
        href: "/app/upcoming",
        emoji: "⏰",
      });
    }

    if (signals.goals.highestPriorityTitle && signals.goals.nextStepLabel) {
      items.push({
        module: "goals",
        priority: 84,
        action: `Do: ${signals.goals.nextStepLabel}`,
        reason: `It moves "${signals.goals.highestPriorityTitle}" forward today.`,
        href: "/app/goals",
        emoji: "🚀",
      });
    }
  }

  if (hasModule(signals, "reading")) {
    if (
      signals.reading.currentBookTitle &&
      signals.reading.minutesToday === 0
    ) {
      items.push({
        module: "reading",
        priority: 78,
        action: `Read for ${Math.min(
          signals.reading.targetMinutes || 20,
          20,
        )} minutes`,
        reason: `Keep "${signals.reading.currentBookTitle}" moving and protect your streak.`,
        href: "/app/reading",
        emoji: "📖",
      });
    } else if (!signals.reading.currentBookTitle) {
      items.push({
        module: "reading",
        priority: 52,
        action: "Choose your next book",
        reason: "Setting a current book makes reading easier to start.",
        href: "/app/reading",
        emoji: "📚",
      });
    }
  }

  if (hasModule(signals, "nutrition")) {
    if (signals.nutrition.mealsLoggedToday === 0) {
      items.push({
        module: "nutrition",
        priority: 74,
        action: "Log your first meal",
        reason: "A quick nutrition check-in makes the rest of the day easier to steer.",
        href: "/app/nutrition",
        emoji: "🥗",
      });
    } else if (signals.nutrition.mealsLoggedToday < 3) {
      items.push({
        module: "nutrition",
        priority: 58,
        action: "Update your nutrition log",
        reason: `You have ${signals.nutrition.mealsLoggedToday} meal${
          signals.nutrition.mealsLoggedToday === 1 ? "" : "s"
        } logged so far today.`,
        href: "/app/nutrition",
        emoji: "🍽️",
      });
    }
  }

  if (hasModule(signals, "fitness")) {
    if (
      typeof signals.fitness.daysSinceWorkout === "number" &&
      signals.fitness.daysSinceWorkout >= 4
    ) {
      items.push({
        module: "fitness",
        priority: 70,
        action: "Plan your next workout",
        reason: `It has been ${signals.fitness.daysSinceWorkout} days since your last logged session.`,
        href: "/app/fitness",
        emoji: "🏋️",
      });
    } else if (signals.fitness.weakestLift) {
      items.push({
        module: "fitness",
        priority: 48,
        action: `Review your ${signals.fitness.weakestLift} progress`,
        reason: "Your weakest area is often the best place to unlock progress.",
        href: "/app/fitness",
        emoji: "💪",
      });
    }
  }

  if (hasModule(signals, "todos") && signals.todos) {
    if (signals.todos.totalToday > 0 && signals.todos.doneToday === 0) {
      items.push({
        module: "todos",
        priority: 60,
        action: "Finish one quick to-do",
        reason: "A small completed task can unlock momentum fast.",
        href: "/app/todos",
        emoji: "✅",
      });
    }
  }

  if (hasModule(signals, "schedule") && signals.schedule) {
    if (
      signals.schedule.totalBlocks > 0 &&
      signals.schedule.completedBlocks < signals.schedule.totalBlocks
    ) {
      items.push({
        module: "schedule",
        priority: 44,
        action: "Review your next schedule block",
        reason: "Seeing the next block clearly lowers startup friction.",
        href: "/app/schedule",
        emoji: "📅",
      });
    }
  }

  const deduped = dedupeByModule(items);

  if (deduped.length === 0) {
    return [
      {
        module: "goals",
        priority: 10,
        action: "Review your upcoming tasks",
        reason: "A quick scan helps you choose the next meaningful step.",
        href: "/app/upcoming",
        emoji: "💡",
      },
    ];
  }

  return deduped;
}