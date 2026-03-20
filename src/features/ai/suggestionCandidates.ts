import type { LucideIcon } from "lucide-react";
import {
  Target,
  Clock3,
  Rocket,
  BookOpen,
  Library,
  Salad,
  Utensils,
  GlassWater,
  Dumbbell,
  Activity,
  CheckSquare,
  CalendarDays,
  Lightbulb,
} from "lucide-react";
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
  icon: LucideIcon;
};

function hasModule(signals: AISignals, module: ModuleId): boolean {
  return signals.modules.includes(module);
}

function getNutritionSuggestion(
  signals: AISignals,
): SuggestionCandidate | null {
  const meals = signals.nutrition.mealsLoggedToday;
  if (meals >= 4) return null; // all meals logged, never suggest

  const hour = new Date().getHours(); // local time

  // Determine if the next meal is actually due yet
  // Breakfast: due from 6am, Lunch: due from 1pm, Snack: due from 5pm, Dinner: due from 9pm
  const mealWindows = [
    { label: "breakfast", dueFrom: 6,  action: "Log breakfast" },
    { label: "lunch",     dueFrom: 13, action: "Log lunch" },
    { label: "snack",     dueFrom: 17, action: "Log your afternoon snack" },
    { label: "dinner",    dueFrom: 21, action: "Log dinner" },
  ];

  const nextMeal = mealWindows[meals]; // meals logged = index of next meal
  if (!nextMeal) return null;

  // Not due yet — don't suggest it
  if (hour < nextMeal.dueFrom) return null;

  return {
    module: "nutrition",
    // Priority 62 — always below overdue steps (96) and next goal step (84)
    // but above fitness/todos/schedule when a meal is actually due
    priority: 62,
    action: nextMeal.action,
    reason: `${meals} of 4 meals logged today.`,
    href: "/app/nutrition",
    icon: meals === 0 ? Salad : Utensils,
  };
}

function getWaterSuggestion(
  signals: AISignals,
): SuggestionCandidate | null {
  if (signals.water.goalHit) return null;

  const amount = signals.water.remainingMl >= 500 ? 500 : 250;

  return {
    module: "nutrition",
    priority: 66,
    action: `Drink ${amount}ml of water`,
    reason: `${signals.water.remainingMl}ml left to hit today's hydration target.`,
    href: "/app/nutrition",
    icon: GlassWater,
  };
}

function dedupeByModule(items: SuggestionCandidate[]): SuggestionCandidate[] {
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
        icon: Target,
      });
    } else {
      // Build one specific suggestion per goal, scored by priority ladder:
      // 98 = high + overdue, 92 = medium + overdue, 86 = high + upcoming (≤3 days),
      // 78 = low + overdue, 72 = medium + upcoming, 64 = low + upcoming
      const THREE_DAYS_FROM_NOW = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().slice(0, 10);
      })();

      const today = new Date().toISOString().slice(0, 10);

      for (const goal of signals.goals.topGoals) {
        const p = goal.priority;

        // Overdue step — most urgent
        if (goal.overdueStepLabel) {
          const baseScore = p === 'high' ? 98 : p === 'medium' ? 92 : 78;
          const overdueBonus = Math.min(goal.overdueCount ?? 0, 9) / 10;
          const score = baseScore + overdueBonus;

          const daysOverdue = goal.overdueStepDate
            ? Math.floor(
                (new Date(today).getTime() -
                  new Date(goal.overdueStepDate).getTime()) /
                  86400000,
              )
            : null;

          items.push({
            module: "goals",
            priority: score,
            action: goal.overdueStepLabel,
            reason: `Overdue step for "${goal.title}" · ${
              goal.overdueCount ?? 1
            } overdue step${(goal.overdueCount ?? 1) === 1 ? '' : 's'}${
              daysOverdue ? ` · ${daysOverdue}d overdue` : ''
            }.`,
            href: "/app/goals",
            icon: Clock3,
          });
        }

        // Upcoming step within 3 days
        if (goal.nextStepLabel && goal.nextStepDate && goal.nextStepDate <= THREE_DAYS_FROM_NOW) {
          const score = p === 'high' ? 86 : p === 'medium' ? 72 : 64;
          const daysUntil = Math.floor((new Date(goal.nextStepDate).getTime() - new Date(today).getTime()) / 86400000);
          items.push({
            module: "goals",
            priority: score,
            action: goal.nextStepLabel,
            reason: `Next step for "${goal.title}"${daysUntil === 0 ? ' · due today' : ` · due in ${daysUntil}d`}.`,
            href: "/app/goals",
            icon: Rocket,
          });
        }

        // Upcoming step with no date — lower priority nudge
        if (goal.nextStepLabel && !goal.nextStepDate && !goal.overdueStepLabel) {
          const score = p === 'high' ? 80 : p === 'medium' ? 66 : 56;
          items.push({
            module: "goals",
            priority: score,
            action: goal.nextStepLabel,
            reason: `Move "${goal.title}" forward today.`,
            href: "/app/goals",
            icon: Rocket,
          });
        }
      }
    }
  }

  if (hasModule(signals, "reading")) {
    if (signals.reading.currentBookTitle) {
      items.push({
        module: "reading",
        priority: 72, // below overdue steps (96) and next goal step (84), above nutrition (62)
        action: `Read ${signals.reading.targetPages} pages of ${signals.reading.currentBookTitle}`,
        reason: signals.reading.streak > 0
          ? `Keep your ${signals.reading.streak}-day streak alive.`
          : "Start a reading streak today.",
        href: "/app/reading",
        icon: BookOpen,
      });
    } else {
      items.push({
        module: "reading",
        priority: 48,
        action: "Choose your next book",
        reason: "Setting a current book makes reading easier to start.",
        href: "/app/reading",
        icon: Library,
      });
    }
  }

  if (hasModule(signals, "nutrition")) {
    const waterSuggestion = getWaterSuggestion(signals);
    if (waterSuggestion) items.push(waterSuggestion);

    const nutritionSuggestion = getNutritionSuggestion(signals);
    if (nutritionSuggestion) items.push(nutritionSuggestion);
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
        icon: Dumbbell,
      });
    } else if (signals.fitness.weakestLift) {
      items.push({
        module: "fitness",
        priority: 48,
        action: `Review your ${signals.fitness.weakestLift} progress`,
        reason: "Your weakest area is often the best place to unlock progress.",
        href: "/app/fitness",
        icon: Activity,
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
        icon: CheckSquare,
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
        icon: CalendarDays,
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
        icon: Lightbulb,
      },
    ];
  }

  return deduped;
}
