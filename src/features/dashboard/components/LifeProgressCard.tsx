import { useEffect, useState } from "react";
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
import { loadNutritionLog, seedNutritionLog } from "@/features/nutrition/nutritionStorage";
import { loadUserGoals, seedUserGoals } from "@/features/goals/userGoalStorage";
import {
  loadReadingInputs,
  seedReadingInputs,
  READING_CHANGED_EVENT,
  getTodayReadingProgress,
} from "@/features/reading/readingStorage";
import { listTodos, seedTodos } from "@/features/todos/todoStorage";
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

type GoalDoneCache = Record<string, boolean | Record<string, boolean>>;

const GOAL_DONE_CACHE_KEYS = ["cache:goals:v1", "cache:goal_steps_done:v1"] as const;
const MODULE_ORDER = ["goals", "fitness", "nutrition", "reading", "todos", "schedule"];

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function readDoneCache(): GoalDoneCache {
  try {
    for (const key of GOAL_DONE_CACHE_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as GoalDoneCache;
      }
    }
    return {};
  } catch {
    return {};
  }
}

function isStepDone(doneCache: GoalDoneCache, goalId: string, stepId: string): boolean {
  const byGoal = doneCache[goalId];
  if (byGoal && typeof byGoal === "object" && !Array.isArray(byGoal)) {
    return Boolean((byGoal as Record<string, boolean>)[stepId]);
  }
  return Boolean(doneCache[stepId]);
}

function isStepOverdue(idealFinish: string | null | undefined, todayKey: string): boolean {
  if (!idealFinish) return false;
  const trimmed = idealFinish.trim();
  if (!trimmed) return false;
  return trimmed < todayKey;
}

function buildGoalsProgress(goals: Awaited<ReturnType<typeof loadUserGoals>>): ModuleProgress {
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

  const doneCache = readDoneCache();
  const todayKey = getLocalDateKey();

  let overdueTotal = 0;
  let overdueDone = 0;

  for (const goal of goals) {
    for (const step of goal.steps) {
      if (!isStepOverdue(step.idealFinish, todayKey)) continue;
      overdueTotal += 1;
      if (isStepDone(doneCache, goal.id, step.id)) {
        overdueDone += 1;
      }
    }
  }

  if (overdueTotal === 0) {
    return {
      id: "goals",
      label: "Goals",
      href: "/app/goals",
      icon: <Target className="h-3.5 w-3.5" />,
      pct: 100,
      primaryStat: "Up to date",
      secondaryStat: "No overdue steps",
      color: "rose",
      accentClass: "bg-rose-500",
    };
  }

  const overdueRemaining = overdueTotal - overdueDone;
  const pct = clampPct((overdueDone / overdueTotal) * 100);

  return {
    id: "goals",
    label: "Goals",
    href: "/app/goals",
    icon: <Target className="h-3.5 w-3.5" />,
    pct,
    primaryStat: `${pluralize(overdueRemaining, "overdue step")} left`,
    secondaryStat: `${overdueDone}/${overdueTotal} overdue cleared`,
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

function buildNutritionProgress(log: Awaited<ReturnType<typeof loadNutritionLog>>): ModuleProgress {
  const mealsLogged = Object.values(log.eaten ?? {}).filter(Boolean).length;
  const customCount = (log.customEntries ?? []).length;
  const itemsLogged = mealsLogged + customCount;
  const pct = clampPct((itemsLogged / 4) * 100);

  return {
    id: "nutrition",
    label: "Nutrition",
    href: "/app/nutrition",
    icon: <Apple className="h-3.5 w-3.5" />,
    pct,
    primaryStat: `${pluralize(itemsLogged, "meal", "meals")} logged`,
    secondaryStat:
      customCount > 0
        ? `${pluralize(customCount, "custom entry", "custom entries")}`
        : undefined,
    color: "orange",
    accentClass: "bg-orange-500",
  };
}

function buildReadingProgress(inputs: Awaited<ReturnType<typeof loadReadingInputs>>): ModuleProgress {
  const hasBook = inputs.current.title.trim().length > 0;
  const streak = inputs.streak ?? 0;
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

function buildTodosProgress(todos: Awaited<ReturnType<typeof listTodos>>): ModuleProgress {
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

function seedProgress(enabledModules: Set<string>): ModuleProgress[] {
  const results: ModuleProgress[] = [];

  try {
    if (enabledModules.has("goals")) {
      results.push(buildGoalsProgress(seedUserGoals()));
    }

    if (enabledModules.has("fitness")) {
      results.push(buildFitnessProgress(readSplitCache()));
    }

    if (enabledModules.has("nutrition")) {
      results.push(buildNutritionProgress(seedNutritionLog()));
    }

    if (enabledModules.has("reading")) {
      results.push(buildReadingProgress(seedReadingInputs()));
    }

    if (enabledModules.has("todos")) {
      results.push(buildTodosProgress(seedTodos()));
    }

    if (enabledModules.has("schedule")) {
      const log = seedScheduleLog();
      const templates = seedScheduleTemplates();
      results.push(buildScheduleProgress(log, templates));
    }
  } catch {
    // seed is best-effort only
  }

  return sortModules(results);
}

async function fetchProgress(enabledModules: Set<string>): Promise<ModuleProgress[]> {
  if (enabledModules.size === 0) return [];

  const results: ModuleProgress[] = [];

  await Promise.allSettled([
    (async () => {
      if (!enabledModules.has("goals")) return;
      results.push(buildGoalsProgress(await loadUserGoals()));
    })(),
    (async () => {
      if (!enabledModules.has("fitness")) return;
      results.push(buildFitnessProgress(await loadWeeklySplit()));
    })(),
    (async () => {
      if (!enabledModules.has("nutrition")) return;
      results.push(buildNutritionProgress(await loadNutritionLog()));
    })(),
    (async () => {
      if (!enabledModules.has("reading")) return;
      results.push(buildReadingProgress(await loadReadingInputs()));
    })(),
    (async () => {
      if (!enabledModules.has("todos")) return;
      results.push(buildTodosProgress(await listTodos()));
    })(),
    (async () => {
      if (!enabledModules.has("schedule")) return;
      const [log, templates] = await Promise.all([loadScheduleLog(), loadScheduleTemplates()]);
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
  const { modules: enabledModules } = useEnabledModules();

  const [progress, setProgress] = useState<ModuleProgress[]>(() => seedProgress(enabledModules));
  const [loading, setLoading] = useState(() => seedProgress(enabledModules).length === 0);

  useEffect(() => {
    if (enabledModules.size === 0) return;

    let cancelled = false;

    async function refresh() {
      const data = await fetchProgress(enabledModules);
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
  }, [enabledModules]);

  const skeletonCount = Math.max(enabledModules.size, 3);

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
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        <div className="flex items-start gap-5">
          {progress.length > 0 && (
            <div className="hidden shrink-0 sm:flex">
              <OverallRing modules={progress} />
            </div>
          )}

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {loading
              ? Array.from({ length: skeletonCount }).map((_, index) => (
                  <SkeletonTile key={index} />
                ))
              : progress.map((item) => <ModuleTile key={item.id} item={item} />)}
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