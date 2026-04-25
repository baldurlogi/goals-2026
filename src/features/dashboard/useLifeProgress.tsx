import { useEffect, useMemo, useState } from "react";
import { Apple, BookOpen, CalendarDays, CheckSquare, Dumbbell, Target } from "lucide-react";
import { useAuth } from "@/features/auth/authContext";
import {
  seedGoalStepHistory,
  useGoalProgressState,
  type DoneState,
  type StepHistoryEntry,
} from "@/features/goals/goalStore";
import { useGoalsState } from "@/features/goals/useGoalsQuery";
import { getTargets, meals } from "@/features/nutrition/nutritionData";
import {
  loadNutritionLog,
  loadPhase,
  seedNutritionCache,
  seedNutritionPhase,
} from "@/features/nutrition/nutritionStorage";
import { isMacroSuccessful } from "@/features/nutrition/nutritionStatus";
import { useProfile } from "@/features/onboarding/useProfile";
import {
  getTodayReadingProgress,
  loadReadingInputs,
  READING_CHANGED_EVENT,
  seedReadingCache,
} from "@/features/reading/readingStorage";
import { getDisplayedReadingStreak } from "@/features/reading/readingUtils";
import {
  loadScheduleLog,
  loadScheduleTemplates,
  seedScheduleLog,
  seedScheduleTemplates,
} from "@/features/schedule/scheduleStorage";
import { loadTodos, seedTodoCache } from "@/features/todos/todoStorage";
import {
  loadWeeklySplit,
  readSplitCache,
  REST_LABELS,
  todayDayKey,
  todayISO,
} from "@/features/fitness/fitnessStorage";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import {
  saveLifeProgressSnapshot,
} from "@/features/dashboard/lifeProgressHistory";

export type ModuleProgress = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  pct: number;
  primaryStat: string;
  secondaryStat?: string;
  streak?: number;
  color: string;
  accentClass: string;
};

const MODULE_ORDER = ["goals", "fitness", "nutrition", "reading", "todos", "schedule"];

const MEAL_MACROS_BY_KEY = {
  breakfast1: meals.breakfast.option1.macros,
  breakfast2: meals.breakfast.option2.macros,
  lunchWfh: meals.lunch.wfh.macros,
  lunchOffice: meals.lunch.office.macros,
  afternoonSnack: meals.afternoonSnack.macros,
  postWorkout: meals.postWorkout.macros,
  dinner: meals.dinner.macros,
} as const;

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function isStepDone(doneState: DoneState, goalId: string, stepId: string): boolean {
  return Boolean(doneState[goalId]?.[stepId]);
}

function isStepOverdue(idealFinish: string | null | undefined, todayKey: string): boolean {
  if (!idealFinish) return false;
  const trimmed = idealFinish.trim();
  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;

  const targetTime = new Date(`${trimmed}T00:00:00`).getTime();
  const todayTime = new Date(`${todayKey}T00:00:00`).getTime();

  return Number.isFinite(targetTime) && Number.isFinite(todayTime) && targetTime < todayTime;
}

function isStepDueToday(idealFinish: string | null | undefined, todayKey: string): boolean {
  return Boolean(idealFinish) && idealFinish?.trim() === todayKey;
}

function buildGoalsProgress(
  goals: { steps: Array<{ id: string; idealFinish: string | null }>; id: string }[],
  doneState: DoneState,
  stepHistory: StepHistoryEntry[],
): ModuleProgress {
  if (goals.length === 0) {
    return {
      id: "goals",
      label: "Goals",
      href: "/app/goals",
      icon: <Target className="h-3.5 w-3.5" />,
      pct: 0,
      primaryStat: "No goals yet",
      color: "rose",
      accentClass: "bg-rose-500",
    };
  }

  const todayKey = getLocalDateKey();
  const completedToday = new Set(
    stepHistory
      .filter((entry) => entry.date === todayKey)
      .map((entry) => `${entry.goalId}:${entry.stepId}`),
  );

  let dueNowRemaining = 0;
  let dueNowCompletedToday = 0;

  for (const goal of goals) {
    for (const step of goal.steps) {
      const stepKey = `${goal.id}:${step.id}`;
      const done = isStepDone(doneState, goal.id, step.id);

      if (!isStepOverdue(step.idealFinish, todayKey) && !isStepDueToday(step.idealFinish, todayKey)) {
        continue;
      }

      if (done) {
        if (completedToday.has(stepKey)) {
          dueNowCompletedToday += 1;
        }
        continue;
      }

      dueNowRemaining += 1;
    }
  }

  const dueNowTotal = dueNowRemaining + dueNowCompletedToday;

  if (dueNowTotal === 0) {
    return {
      id: "goals",
      label: "Goals",
      href: "/app/goals",
      icon: <Target className="h-3.5 w-3.5" />,
      pct: 100,
      primaryStat: "Up to date",
      secondaryStat: "No overdue or today steps",
      color: "rose",
      accentClass: "bg-rose-500",
    };
  }

  return {
    id: "goals",
    label: "Goals",
      href: "/app/goals",
      icon: <Target className="h-3.5 w-3.5" />,
    pct: clampPct((dueNowCompletedToday / dueNowTotal) * 100),
    primaryStat: `${pluralize(dueNowRemaining, "step")} left`,
    secondaryStat: `${dueNowCompletedToday}/${dueNowTotal} overdue + today cleared`,
    color: "rose",
    accentClass: "bg-rose-500",
  };
}

function buildFitnessProgress(
  split: Awaited<ReturnType<typeof loadWeeklySplit>>,
): ModuleProgress {
  const dayKey = todayDayKey();
  const today = todayISO();
  const day = split.days[dayKey];
  const label = day?.label?.trim() || "Workout";
  const normalized = label.toLowerCase();
  const isRestDay = REST_LABELS.has(normalized);
  const isDoneToday = day?.completedDate === today;

  return {
    id: "fitness",
    label: "Fitness",
    href: "/app/fitness",
    icon: <Dumbbell className="h-3.5 w-3.5" />,
    pct: isRestDay || isDoneToday ? 100 : 0,
    streak: split.streak ?? 0,
    primaryStat: isRestDay
      ? "Rest / recovery day"
      : isDoneToday
        ? `${label} done`
        : `${label} not done yet`,
    secondaryStat: isRestDay
      ? "No workout due today"
      : isDoneToday
        ? "Marked complete in Fitness"
        : "Mark today complete in Fitness",
    color: "violet",
    accentClass: "bg-violet-500",
  };
}

function getMacroScore(
  log: Awaited<ReturnType<typeof loadNutritionLog>>,
  targets: { cal: number; protein: number; carbs: number; fat: number },
) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const [mealKey, eaten] of Object.entries(log.eaten ?? {})) {
    if (!eaten) continue;
    const meal = MEAL_MACROS_BY_KEY[mealKey as keyof typeof MEAL_MACROS_BY_KEY];
    if (!meal) continue;
    totals.calories += meal.cal;
    totals.protein += meal.protein;
    totals.carbs += meal.carbs;
    totals.fat += meal.fat;
  }

  for (const entry of log.customEntries ?? []) {
    totals.calories += entry.macros.cal;
    totals.protein += entry.macros.protein;
    totals.carbs += entry.macros.carbs;
    totals.fat += entry.macros.fat;
  }

  const checks = [
    { key: "cal" as const, value: totals.calories, target: targets.cal },
    { key: "protein" as const, value: totals.protein, target: targets.protein },
    { key: "carbs" as const, value: totals.carbs, target: targets.carbs },
    { key: "fat" as const, value: totals.fat, target: targets.fat },
  ];

  return checks.reduce((count, check) => {
    return count + (isMacroSuccessful(check.key, check.value, check.target) ? 1 : 0);
  }, 0);
}

function buildNutritionProgress(
  log: Awaited<ReturnType<typeof loadNutritionLog>>,
  targets: { cal: number; protein: number; carbs: number; fat: number },
): ModuleProgress {
  const inRange = getMacroScore(log, targets);

  return {
    id: "nutrition",
    label: "Nutrition",
    href: "/app/nutrition",
    icon: <Apple className="h-3.5 w-3.5" />,
    pct: clampPct((inRange / 4) * 100),
    primaryStat: `${inRange}/4 macros in range`,
    secondaryStat:
      inRange === 4
        ? "Green across calories, protein, carbs, and fat"
        : "Score is based on macro target hit",
    color: "orange",
    accentClass: "bg-orange-500",
  };
}

function buildReadingProgress(inputs: Awaited<ReturnType<typeof loadReadingInputs>>): ModuleProgress {
  const hasBook = inputs.current.title.trim().length > 0;
  const daily = getTodayReadingProgress(inputs);

  return {
    id: "reading",
    label: "Reading",
    href: "/app/reading",
    icon: <BookOpen className="h-3.5 w-3.5" />,
    pct: daily.pct,
    primaryStat: hasBook
      ? daily.goalPages > 0
        ? `${daily.pagesRead}/${daily.goalPages} pages today`
        : `${daily.pagesRead} pages today`
      : "No book set",
    secondaryStat: hasBook
      ? daily.goalPages > 0
        ? daily.pct >= 100
          ? "Daily goal hit ✅"
          : `${Math.max(daily.goalPages - daily.pagesRead, 0)} to goal`
        : daily.pagesRead > 0
          ? "Reading logged today"
          : "Start today's reading"
      : undefined,
    streak: getDisplayedReadingStreak(
      inputs.streak ?? 0,
      inputs.lastReadDate,
      getLocalDateKey(),
    ),
    color: "emerald",
    accentClass: "bg-emerald-500",
  };
}

function buildTodosProgress(todos: Awaited<ReturnType<typeof loadTodos>>): ModuleProgress {
  const done = todos.filter((todo) => todo.done).length;
  const total = todos.length;

  return {
    id: "todos",
    label: "To-do",
    href: "/app/todos",
    icon: <CheckSquare className="h-3.5 w-3.5" />,
    pct: total === 0 ? 100 : clampPct((done / total) * 100),
    primaryStat: total === 0 ? "All clear!" : `${done}/${total} done`,
    secondaryStat: total > 0 && done === total ? "All complete 🎉" : undefined,
    color: "sky",
    accentClass: "bg-sky-500",
  };
}

function buildScheduleProgress(
  log: Awaited<ReturnType<typeof loadScheduleLog>>,
  templates: Awaited<ReturnType<typeof loadScheduleTemplates>>,
): ModuleProgress {
  const blocks = templates[log.dayKey] ?? [];
  const total = log.totalBlocks || blocks.length;
  const done = log.completed.length;
  const dayLabel =
    log.dayKey.charAt(0).toUpperCase() + log.dayKey.slice(1);

  return {
    id: "schedule",
    label: "Schedule",
    href: "/app/schedule",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
    pct: total === 0 ? 100 : clampPct((done / total) * 100),
    primaryStat: total === 0 ? "No blocks today" : `${done}/${total} blocks`,
    secondaryStat: `${dayLabel} plan`,
    color: "amber",
    accentClass: "bg-amber-500",
  };
}

function sortModules(results: ModuleProgress[]) {
  return [...results].sort((left, right) => MODULE_ORDER.indexOf(left.id) - MODULE_ORDER.indexOf(right.id));
}

function seedProgress(
  enabledModules: Set<string>,
  activeUserId: string | null,
  profile: ReturnType<typeof useProfile>,
): ModuleProgress[] {
  const results: ModuleProgress[] = [];

  try {
    if (enabledModules.has("fitness")) {
      results.push(buildFitnessProgress(readSplitCache()));
    }
    if (enabledModules.has("nutrition")) {
      results.push(
        buildNutritionProgress(
          seedNutritionCache(activeUserId),
          getTargets(seedNutritionPhase(activeUserId), profile),
        ),
      );
    }
    if (enabledModules.has("reading")) {
      results.push(buildReadingProgress(seedReadingCache(activeUserId)));
    }
    if (enabledModules.has("todos")) {
      results.push(buildTodosProgress(seedTodoCache(activeUserId)));
    }
    if (enabledModules.has("schedule")) {
      results.push(
        buildScheduleProgress(seedScheduleLog(activeUserId), seedScheduleTemplates(activeUserId)),
      );
    }
  } catch {
    // seed is best-effort only
  }

  return sortModules(results);
}

async function fetchProgress(
  enabledModules: Set<string>,
  activeUserId: string | null,
  profile: ReturnType<typeof useProfile>,
) {
  if (enabledModules.size === 0) return [];

  const results: ModuleProgress[] = [];

  await Promise.allSettled([
    (async () => {
      if (enabledModules.has("fitness")) {
        results.push(buildFitnessProgress(await loadWeeklySplit(activeUserId)));
      }
    })(),
    (async () => {
      if (enabledModules.has("nutrition")) {
        const [log, phase] = await Promise.all([
          loadNutritionLog(activeUserId),
          loadPhase(activeUserId),
        ]);
        results.push(buildNutritionProgress(log, getTargets(phase, profile)));
      }
    })(),
    (async () => {
      if (enabledModules.has("reading")) {
        results.push(buildReadingProgress(await loadReadingInputs(activeUserId)));
      }
    })(),
    (async () => {
      if (enabledModules.has("todos")) {
        results.push(buildTodosProgress(await loadTodos(activeUserId)));
      }
    })(),
    (async () => {
      if (enabledModules.has("schedule")) {
        const [log, templates] = await Promise.all([
          loadScheduleLog(activeUserId, { preferCache: false }),
          loadScheduleTemplates(activeUserId),
        ]);
        results.push(buildScheduleProgress(log, templates));
      }
    })(),
  ]);

  return sortModules(results);
}

export function calculateOverallScore(modules: ModuleProgress[]) {
  if (modules.length === 0) return 0;
  return clampPct(modules.reduce((sum, module) => sum + module.pct, 0) / modules.length);
}

export function useLifeProgress() {
  const { userId } = useAuth();
  const profile = useProfile();
  const { modules: enabledModules } = useEnabledModules();
  const { doneState, isGoalProgressLoading } = useGoalProgressState();
  const { goals, isGoalsLoading } = useGoalsState();
  const scopedUserId = userId;
  const [stepHistory, setStepHistory] = useState<StepHistoryEntry[]>(() =>
    seedGoalStepHistory(scopedUserId),
  );

  const initialProgress = useMemo(
    () => seedProgress(enabledModules, scopedUserId, profile),
    [enabledModules, profile, scopedUserId],
  );
  const [progress, setProgress] = useState<ModuleProgress[]>(initialProgress);
  const [loading, setLoading] = useState(initialProgress.length === 0);
  const [hasFreshProgress, setHasFreshProgress] = useState(enabledModules.size === 0);

  useEffect(() => {
    setProgress(seedProgress(enabledModules, scopedUserId, profile));
    setHasFreshProgress(enabledModules.size === 0);
  }, [enabledModules, profile, scopedUserId]);

  useEffect(() => {
    const syncGoalHistory = () => {
      setStepHistory(seedGoalStepHistory(scopedUserId));
    };

    syncGoalHistory();
    window.addEventListener("goals:changed", syncGoalHistory);

    return () => {
      window.removeEventListener("goals:changed", syncGoalHistory);
    };
  }, [doneState, scopedUserId]);

  useEffect(() => {
    if (enabledModules.size === 0) return;

    let cancelled = false;

    async function refresh() {
      const data = await fetchProgress(enabledModules, scopedUserId, profile);
      if (cancelled) return;
      setProgress(data);
      setLoading(false);
      setHasFreshProgress(true);
    }

    void refresh();

    const handleChange = () => {
      void refresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    const interval = window.setInterval(() => {
      void refresh();
    }, 30_000);

    const events = [
      "fitness:changed",
      "nutrition:changed",
      "todos:changed",
      "schedule:changed",
      READING_CHANGED_EVENT,
      "goal_module:changed",
      "goals:changed",
    ];

    events.forEach((eventName) => window.addEventListener(eventName, handleChange));
    window.addEventListener("focus", handleChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      events.forEach((eventName) => window.removeEventListener(eventName, handleChange));
      window.removeEventListener("focus", handleChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabledModules, profile, scopedUserId]);

  const modulesProgress = useMemo(() => {
    const withoutGoals = progress.filter((item) => item.id !== "goals");

    if (!enabledModules.has("goals")) {
      return sortModules(withoutGoals);
    }

    return sortModules([
      buildGoalsProgress(goals, doneState, stepHistory),
      ...withoutGoals,
    ]);
  }, [doneState, enabledModules, goals, progress, stepHistory]);

  const overallScore = useMemo(() => calculateOverallScore(modulesProgress), [modulesProgress]);

  const showLoading =
    loading ||
    (enabledModules.has("goals") &&
      isGoalProgressLoading &&
      isGoalsLoading &&
      modulesProgress.length === 0);

  useEffect(() => {
    if (showLoading || !hasFreshProgress || !scopedUserId || modulesProgress.length === 0) return;

    saveLifeProgressSnapshot(scopedUserId, {
      date: getLocalDateKey(),
      score: overallScore,
    });
  }, [hasFreshProgress, modulesProgress, overallScore, scopedUserId, showLoading]);

  return {
    modulesProgress,
    overallScore,
    loading: showLoading,
    skeletonCount: Math.max(enabledModules.size, 3),
  };
}
