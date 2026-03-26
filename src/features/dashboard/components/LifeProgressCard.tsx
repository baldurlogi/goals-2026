import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Dumbbell,
  Apple,
  BookOpen,
  CheckSquare,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  seedGoalStepHistory,
  useGoalProgressState,
  type DoneState,
  type StepHistoryEntry,
} from "@/features/goals/goalStore";
import { useGoalsState } from "@/features/goals/useGoalsQuery";
import { loadNutritionLog, loadPhase, seedNutritionCache } from "@/features/nutrition/nutritionStorage";
import { getTargets, meals } from "@/features/nutrition/nutritionData";
import { isMacroSuccessful } from "@/features/nutrition/nutritionStatus";
import {
  loadReadingInputs,
  seedReadingCache,
  READING_CHANGED_EVENT,
  getTodayReadingProgress,
} from "@/features/reading/readingStorage";
import { getDisplayedReadingStreak } from "@/features/reading/readingUtils";
import { loadTodos, seedTodoCache } from "@/features/todos/todoStorage";
import {
  loadScheduleLog,
  loadScheduleTemplates,
  seedScheduleLog,
  seedScheduleTemplates,
} from "@/features/schedule/scheduleStorage";
import {
  loadWeeklySplit,
  readSplitCache,
  todayDayKey,
  todayISO,
  REST_LABELS,
} from "@/features/fitness/fitnessStorage";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { getActiveUserId } from "@/lib/activeUser";
import { formatDateWithPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";

type ModuleProgress = {
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
  if (!trimmed) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;

  const targetTime = new Date(`${trimmed}T00:00:00`).getTime();
  const todayTime = new Date(`${todayKey}T00:00:00`).getTime();
  if (!Number.isFinite(targetTime) || !Number.isFinite(todayTime)) return false;

  return targetTime < todayTime;
}

function isStepDueToday(idealFinish: string | null | undefined, todayKey: string): boolean {
  if (!idealFinish) return false;
  return idealFinish.trim() === todayKey;
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
      const isOverdue = isStepOverdue(step.idealFinish, todayKey);
      const isDueToday = isStepDueToday(step.idealFinish, todayKey);
      if (!isOverdue && !isDueToday) continue;

      const stepKey = `${goal.id}:${step.id}`;
      const done = isStepDone(doneState, goal.id, step.id);

      if (done) {
        if (completedToday.has(stepKey)) {
          dueNowCompletedToday += 1;
        }
        continue;
      }

      dueNowRemaining += 1;
    }
  }

  const dueNowTotalAtStartOfDay = dueNowRemaining + dueNowCompletedToday;

  if (dueNowTotalAtStartOfDay === 0) {
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

  const pct = clampPct(
    (dueNowCompletedToday / dueNowTotalAtStartOfDay) * 100,
  );

  return {
    id: "goals",
    label: "Goals",
    href: "/app/goals",
    icon: <Target className="h-3.5 w-3.5" />,
    pct,
    primaryStat: `${pluralize(dueNowRemaining, "step")} left`,
    secondaryStat: `${dueNowCompletedToday}/${dueNowTotalAtStartOfDay} overdue + today cleared`,
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

  const pct = isRestDay ? 100 : isDoneToday ? 100 : 0;

  return {
    id: "fitness",
    label: "Fitness",
    href: "/app/fitness",
    icon: <Dumbbell className="h-3.5 w-3.5" />,
    pct,
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

function getMacroScore(log: Awaited<ReturnType<typeof loadNutritionLog>>, targets: { cal: number; protein: number; carbs: number; fat: number; }) {
  const totals = ["calories", "protein", "carbs", "fat"].reduce<Record<string, number>>((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

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
  let inRange = 0;

  for (const check of checks) {
    if (isMacroSuccessful(check.key, check.value, check.target)) inRange += 1;
  }

  return { inRange, totals };
}

function buildNutritionProgress(
  log: Awaited<ReturnType<typeof loadNutritionLog>>,
  targets: { cal: number; protein: number; carbs: number; fat: number },
): ModuleProgress {
  const { inRange } = getMacroScore(log, targets);
  const pct = clampPct((inRange / 4) * 100);

  return {
    id: "nutrition",
    label: "Nutrition",
    href: "/app/nutrition",
    icon: <Apple className="h-3.5 w-3.5" />,
    pct,
    primaryStat: `${inRange}/4 macros in range`,
    secondaryStat: inRange === 4 ? 'Green across calories, protein, carbs, and fat' : 'Score is based on macro target hit',
    color: "orange",
    accentClass: "bg-orange-500",
  };
}

function buildReadingProgress(inputs: Awaited<ReturnType<typeof loadReadingInputs>>): ModuleProgress {
  const hasBook = inputs.current.title.trim().length > 0;
  const streak = getDisplayedReadingStreak(
    inputs.streak ?? 0,
    inputs.lastReadDate,
    getLocalDateKey(),
  );
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
    streak,
    color: "emerald",
    accentClass: "bg-emerald-500",
  };
}

function buildTodosProgress(todos: Awaited<ReturnType<typeof loadTodos>>): ModuleProgress {
  const done = todos.filter((t) => t.done).length;
  const total = todos.length;
  const pct = total === 0 ? 100 : clampPct((done / total) * 100);

  return {
    id: "todos",
    label: "To-do",
    href: "/app/todos",
    icon: <CheckSquare className="h-3.5 w-3.5" />,
    pct,
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
  const blocks = templates[log.view] ?? [];
  const total = blocks.length;
  const done = log.completed.length;
  const pct = total === 0 ? 100 : clampPct((done / total) * 100);

  return {
    id: "schedule",
    label: "Schedule",
    href: "/app/schedule",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
    pct,
    primaryStat: total === 0 ? "No blocks today" : `${done}/${total} blocks`,
    secondaryStat:
      log.view === "wfh" ? "WFH day" : log.view === "office" ? "Office day" : "Weekend",
    color: "amber",
    accentClass: "bg-amber-500",
  };
}

function sortModules(results: ModuleProgress[]): ModuleProgress[] {
  return results.sort((a, b) => MODULE_ORDER.indexOf(a.id) - MODULE_ORDER.indexOf(b.id));
}

function seedProgress(
  enabledModules: Set<string>,
  activeUserId: string | null,
): ModuleProgress[] {
  const results: ModuleProgress[] = [];

  try {
    if (enabledModules.has("fitness")) {
      results.push(buildFitnessProgress(readSplitCache()));
    }

    if (enabledModules.has("nutrition")) {
      results.push(buildNutritionProgress(seedNutritionCache(activeUserId), getTargets("maintain")));
    }

    if (enabledModules.has("reading")) {
      results.push(buildReadingProgress(seedReadingCache(activeUserId)));
    }

    if (enabledModules.has("todos")) {
      results.push(buildTodosProgress(seedTodoCache(activeUserId)));
    }

    if (enabledModules.has("schedule")) {
      const log = seedScheduleLog(activeUserId);
      const templates = seedScheduleTemplates(activeUserId);
      results.push(buildScheduleProgress(log, templates));
    }
  } catch {
    // seed is best-effort only
  }

  return sortModules(results);
}

async function fetchProgress(
  enabledModules: Set<string>,
  activeUserId: string | null,
): Promise<ModuleProgress[]> {
  if (enabledModules.size === 0) return [];

  const results: ModuleProgress[] = [];

  await Promise.allSettled([
    (async () => {
      if (!enabledModules.has("fitness")) return;
      results.push(buildFitnessProgress(await loadWeeklySplit(activeUserId)));
    })(),
    (async () => {
      if (!enabledModules.has("nutrition")) return;
      const [log, phase] = await Promise.all([loadNutritionLog(activeUserId), loadPhase(activeUserId)]);
      results.push(buildNutritionProgress(log, getTargets(phase)));
    })(),
    (async () => {
      if (!enabledModules.has("reading")) return;
      results.push(buildReadingProgress(await loadReadingInputs(activeUserId)));
    })(),
    (async () => {
      if (!enabledModules.has("todos")) return;
      results.push(buildTodosProgress(await loadTodos(activeUserId)));
    })(),
    (async () => {
      if (!enabledModules.has("schedule")) return;
      const [log, templates] = await Promise.all([loadScheduleLog(activeUserId), loadScheduleTemplates(activeUserId)]);
      results.push(buildScheduleProgress(log, templates));
    })(),
  ]);

  return sortModules(results);
}

function ProgressBar({ pct, accentClass }: { pct: number; accentClass: string }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${accentClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ModuleTile({ item }: { item: ModuleProgress }) {
  return (
    <Link
      to={item.href}
      className="group flex flex-col gap-2.5 rounded-xl border bg-card/60 p-3.5 transition-all hover:bg-card hover:shadow-sm hover:ring-1 hover:ring-border"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-${item.color}-500 shrink-0`}>{item.icon}</span>
          <span className="text-xs font-semibold truncate">{item.label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.streak != null && item.streak > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
              🔥 {item.streak}
            </span>
          )}
          <span className={`text-xs font-bold tabular-nums text-${item.color}-500`}>
            {item.pct}%
          </span>
        </div>
      </div>

      <ProgressBar pct={item.pct} accentClass={item.accentClass} />

      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium text-foreground leading-tight">
          {item.primaryStat}
        </span>
        {item.secondaryStat && (
          <span className="text-[10px] text-muted-foreground leading-tight truncate">
            {item.secondaryStat}
          </span>
        )}
      </div>
    </Link>
  );
}

function SkeletonTile() {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border bg-card/40 p-3.5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-3 w-8 rounded bg-muted" />
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted" />
      <div className="h-3 w-24 rounded bg-muted" />
    </div>
  );
}

function OverallRing({ modules }: { modules: ModuleProgress[] }) {
  if (modules.length === 0) return null;

  const avg = clampPct(modules.reduce((sum, module) => sum + module.pct, 0) / modules.length);
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (avg / 100) * circumference;
  const label =
    avg >= 80 ? "Crushing it 🔥" :
    avg >= 60 ? "Good momentum" :
    avg >= 40 ? "Building up" :
    avg >= 20 ? "Getting started" :
    "Let's go!";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-14 w-14">
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" strokeWidth="3" className="stroke-muted" />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="stroke-violet-500 transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
          {avg}%
        </span>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight max-w-[60px]">
        {label}
      </span>
    </div>
  );
}

function LifeProgressCardInner() {
  const preferences = useUserPreferences();
  const { modules: enabledModules } = useEnabledModules();
  const { doneState, isGoalProgressLoading } = useGoalProgressState();
  const { goals, isGoalsLoading } = useGoalsState();

  const activeUserId = getActiveUserId();
  const stepHistory = useMemo(
    () => seedGoalStepHistory(activeUserId),
    [activeUserId, doneState],
  );
  const [progress, setProgress] = useState<ModuleProgress[]>(() =>
    seedProgress(enabledModules, activeUserId),
  );
  const [loading, setLoading] = useState(
    () => seedProgress(enabledModules, activeUserId).length === 0,
  );

  useEffect(() => {
    if (enabledModules.size === 0) return;

    let cancelled = false;

    async function refresh() {
      const data = await fetchProgress(enabledModules, activeUserId);
      if (cancelled) return;
      setProgress(data);
      setLoading(false);
    }

    void refresh();

    const handleChange = () => {
      void refresh();
    };

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

    return () => {
      cancelled = true;
      events.forEach((eventName) => window.removeEventListener(eventName, handleChange));
    };
  }, [activeUserId, enabledModules]);

  const resolvedProgress = useMemo(() => {
    const withoutGoals = progress.filter((item) => item.id !== "goals");

    if (!enabledModules.has("goals")) {
      return sortModules(withoutGoals);
    }

    return sortModules([
      buildGoalsProgress(goals, doneState, stepHistory),
      ...withoutGoals,
    ]);
  }, [doneState, enabledModules, goals, progress, stepHistory]);

  const skeletonCount = Math.max(enabledModules.size, 3);
  const showLoading =
    loading ||
    (enabledModules.has("goals") &&
      isGoalProgressLoading &&
      isGoalsLoading &&
      resolvedProgress.length === 0);

  return (
    <Card className="lg:col-span-12 overflow-hidden">
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15">
              <Target className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Today&apos;s progress
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground/50">
            {formatDateWithPreferences(new Date(), preferences, {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        <div className="flex items-start gap-5">
          {resolvedProgress.length > 0 && (
            <div className="hidden shrink-0 sm:flex">
              <OverallRing modules={resolvedProgress} />
            </div>
          )}

            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {showLoading
              ? Array.from({ length: skeletonCount }).map((_, index) => (
                  <SkeletonTile key={index} />
                ))
              : resolvedProgress.map((item) => <ModuleTile key={item.id} item={item} />)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LifeProgressCard() {
  return (
    <ErrorBoundary
      variant="card"
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onRetry={reset}
          label="Life Progress"
          colSpan="lg:col-span-12"
        />
      )}
    >
      <LifeProgressCardInner />
    </ErrorBoundary>
  );
}
