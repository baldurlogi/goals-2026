import type { LucideIcon } from "lucide-react";
import {
  Target,
  Clock3,
  Rocket,
  BookOpen,
  Library,
  Moon,
  Heart,
  Salad,
  Utensils,
  GlassWater,
  Dumbbell,
  Activity,
  CheckSquare,
  CalendarDays,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import type { ModuleId } from "@/features/modules/modules";
import type { AISignals } from "@/features/ai/aiSignals";

export type SuggestionModule = Extract<
  ModuleId,
  | "goals"
  | "reading"
  | "nutrition"
  | "fitness"
  | "schedule"
  | "todos"
  | "sleep"
  | "wellbeing"
  | "skincare"
>;

export type SuggestionCandidate = {
  module: SuggestionModule;
  priority: number;
  action: string;
  reason: string;
  href: string;
  icon: LucideIcon;
};

function goalCandidatePriority(
  priority: string | null,
  stepDate: string | null,
  overdueCount: number,
  today: string,
): number {
  const priorityBonus = priority === "high" ? 2 : priority === "medium" ? 1 : 0;

  if (stepDate && stepDate < today) {
    return 120 + Math.min(overdueCount, 9) + priorityBonus;
  }

  if (stepDate === today) {
    return 108 + priorityBonus;
  }

  if (!stepDate) {
    return 72 + priorityBonus;
  }

  const daysUntil = Math.floor(
    (new Date(stepDate).getTime() - new Date(today).getTime()) / 86400000,
  );

  if (daysUntil <= 1) return 96 + priorityBonus;
  if (daysUntil <= 3) return 84 + priorityBonus;
  return 70 + priorityBonus;
}

function hasModule(signals: AISignals, module: ModuleId): boolean {
  return signals.modules.includes(module);
}

function getCurrentHour(): number {
  return new Date().getHours();
}

function getExpectedWaterProgressPct(hour: number): number {
  if (hour < 8) return 0.1;
  if (hour < 10) return 0.22;
  if (hour < 12) return 0.34;
  if (hour < 14) return 0.45;
  if (hour < 16) return 0.57;
  if (hour < 18) return 0.68;
  if (hour < 20) return 0.78;
  if (hour < 22) return 0.9;
  return 1;
}

function getWaterPacingSnapshot(signals: AISignals): {
  hour: number;
  expectedMl: number;
  hydrationGap: number;
  behindForTime: boolean;
  suggestedAmountMl: 250 | 500;
} {
  const hour = getCurrentHour();
  const expectedMl = Math.round(
    signals.water.targetMl * getExpectedWaterProgressPct(hour),
  );
  const hydrationGap = Math.max(expectedMl - signals.water.ml, 0);
  const behindForTime = hydrationGap >= 250;
  const suggestedAmountMl: 250 | 500 =
    hydrationGap >= 500 && signals.water.remainingMl >= 500 ? 500 : 250;

  return {
    hour,
    expectedMl,
    hydrationGap,
    behindForTime,
    suggestedAmountMl,
  };
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

function getReadingSuggestion(
  signals: AISignals,
): SuggestionCandidate | null {
  if (!signals.reading.currentBookTitle) {
    return {
      module: "reading",
      priority: 40,
      action: "Choose your next book",
      reason: "Setting a current book makes reading easier to start.",
      href: "/app/reading",
      icon: Library,
    };
  }

  if (signals.reading.goalHitToday) return null;

  const pagesRemaining = Math.max(
    signals.reading.targetPages - signals.reading.pagesReadToday,
    0,
  );
  const hour = getCurrentHour();
  const streakPressure = signals.reading.streak >= 3 ? 2 : 0;
  const lateDayBonus = hour >= 20 ? 4 : hour >= 17 ? 2 : 0;
  const startedTodayPenalty = signals.reading.pagesReadToday > 0 ? 6 : 0;

  return {
    module: "reading",
    priority: 44 + streakPressure + lateDayBonus - startedTodayPenalty,
    action:
      pagesRemaining > 0
        ? `Read ${pagesRemaining} more page${pagesRemaining === 1 ? "" : "s"} of ${signals.reading.currentBookTitle}`
        : `Open ${signals.reading.currentBookTitle}`,
    reason:
      signals.reading.pagesReadToday > 0
        ? `${signals.reading.pagesReadToday}/${signals.reading.targetPages} pages done so far today.`
        : signals.reading.streak > 0
          ? `Keep your ${signals.reading.streak}-day streak alive.`
          : "Start a reading streak today.",
    href: "/app/reading",
    icon: BookOpen,
  };
}

function getWaterSuggestion(
  signals: AISignals,
): SuggestionCandidate | null {
  if (signals.water.goalHit) return null;

  const { expectedMl, behindForTime, suggestedAmountMl } =
    getWaterPacingSnapshot(signals);

  return {
    module: "nutrition",
    priority: behindForTime ? 78 : 66,
    action: `Drink ${suggestedAmountMl}ml of water`,
    reason: behindForTime
      ? `${signals.water.remainingMl}ml left, and by now you'd usually be around ${expectedMl}ml.`
      : `${signals.water.remainingMl}ml left to hit today's hydration target.`,
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
      const today = new Date().toISOString().slice(0, 10);

      for (const goal of signals.goals.topGoals) {
        const p = goal.priority;

        // Overdue step — most urgent
        if (goal.overdueStepLabel) {
          const score = goalCandidatePriority(
            p,
            goal.overdueStepDate,
            goal.overdueCount ?? 0,
            today,
          );

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

        // Upcoming step within 3 days, with due-today outranking any later step
        if (
          goal.nextStepLabel &&
          goal.nextStepDate
        ) {
          const daysUntil = Math.floor((new Date(goal.nextStepDate).getTime() - new Date(today).getTime()) / 86400000);
          if (daysUntil > 3) continue;
          const score = goalCandidatePriority(
            p,
            goal.nextStepDate,
            goal.overdueCount ?? 0,
            today,
          );
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
          const score = goalCandidatePriority(p, null, goal.overdueCount ?? 0, today);
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
    const readingSuggestion = getReadingSuggestion(signals);
    if (readingSuggestion) items.push(readingSuggestion);
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
    if (signals.todos.openCount > 0) {
      items.push({
        module: "todos",
        priority: signals.todos.doneToday === 0 ? 60 : 54,
        action: "Finish one quick to-do",
        reason:
          signals.todos.doneToday === 0
            ? "A small completed task can unlock momentum fast."
            : `${signals.todos.openCount} to-do${signals.todos.openCount === 1 ? "" : "s"} still open today.`,
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
        priority: 56,
        action: "Review your next schedule block",
        reason: `${signals.schedule.completedBlocks}/${signals.schedule.totalBlocks} schedule blocks completed today.`,
        href: "/app/schedule",
        icon: CalendarDays,
      });
    }
  }

  if (hasModule(signals, "sleep") && !signals.sleep.loggedToday && getCurrentHour() >= 10) {
    const hour = getCurrentHour();
    items.push({
      module: "sleep",
      priority: hour >= 20 ? 66 : hour >= 15 ? 61 : 56,
      action: "Log last night's sleep",
      reason:
        hour >= 20
          ? "You still haven’t logged sleep today, and that recovery data is now missing from the day."
          : "A quick sleep log helps your recovery view stay useful.",
      href: "/app/sleep",
      icon: Moon,
    });
  }

  if (hasModule(signals, "wellbeing")) {
    const hour = getCurrentHour();

    if (!signals.wellbeing.loggedToday && hour >= 12) {
      items.push({
        module: "wellbeing",
        priority: hour >= 20 ? 64 : hour >= 17 ? 60 : 54,
        action: "Do a quick mental wellbeing check-in",
        reason:
          hour >= 20
            ? "Close the day with a simple mood check and short note."
            : "A quick check-in gives your coach better context than guessing how the day felt.",
        href: "/app/wellbeing",
        icon: Heart,
      });
    } else if (
      signals.wellbeing.loggedToday &&
      !signals.wellbeing.journaledToday &&
      hour >= 16
    ) {
      items.push({
        module: "wellbeing",
        priority: hour >= 20 ? 59 : 55,
        action: "Add a short journal note",
        reason:
          "You already checked in today. One sentence about how the day felt makes the log much more useful later.",
        href: "/app/wellbeing",
        icon: Heart,
      });
    } else if (
      signals.wellbeing.journalDaysLast7 <= 1 &&
      hour >= 18
    ) {
      items.push({
        module: "wellbeing",
        priority: 52,
        action: "Write a quick reflection tonight",
        reason: "Your journal has been quiet lately. A short note is enough.",
        href: "/app/wellbeing",
        icon: Heart,
      });
    }
  }

  if (hasModule(signals, "skincare") && signals.skincare) {
    const hour = getCurrentHour();

    if (!signals.skincare.amDone && hour >= 6 && hour < 14) {
      items.push({
        module: "skincare",
        priority: 52,
        action: "Complete your AM skincare routine",
        reason: "A quick morning routine keeps the streak easier to maintain.",
        href: "/app/skincare",
        icon: Sparkles,
      });
    }

    if (!signals.skincare.pmDone && hour >= 18) {
      items.push({
        module: "skincare",
        priority: 52,
        action: "Complete your PM skincare routine",
        reason: "Closing your routine tonight makes tomorrow easier to restart.",
        href: "/app/skincare",
        icon: Sparkles,
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
