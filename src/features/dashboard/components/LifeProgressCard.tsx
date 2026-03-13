import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Target, Dumbbell, Apple, BookOpen, CheckSquare, CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  readPRCache,
  loadPRGoals,
  currentBest,
  progressPct,
  fmtValue,
} from "@/features/fitness/fitnessStorage";
import { loadNutritionLog } from "@/features/nutrition/nutritionStorage";
import { loadUserGoals, seedUserGoals } from "@/features/goals/userGoalStorage";
import { loadReadingInputs, seedReadingInputs, READING_CHANGED_EVENT } from "@/features/reading/readingStorage";
import { listTodos, seedTodos } from "@/features/todos/todoStorage";
import { loadScheduleLog, loadScheduleTemplates, seedScheduleLog, seedScheduleTemplates } from "@/features/schedule/scheduleStorage";
import { seedNutritionLog } from "@/features/nutrition/nutritionStorage";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";

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

// ── Per-module builders (accept data, no fetching) ────────────────────────────

function buildGoalsProgress(goals: Awaited<ReturnType<typeof loadUserGoals>>): ModuleProgress {
  if (goals.length === 0) {
    return {
      id: "goals", label: "Goals", href: "/app/goals",
      icon: <Target className="h-3.5 w-3.5" />,
      pct: 0, primaryStat: "No goals yet",
      color: "rose", accentClass: "bg-rose-500",
    };
  }
  const totalSteps = goals.reduce((s, g) => s + g.steps.length, 0);
  const pct = totalSteps === 0 ? 0 : Math.min(
    Math.round((goals.filter((g) => g.steps.length > 0).length / goals.length) * 100), 100,
  );
  return {
    id: "goals", label: "Goals", href: "/app/goals",
    icon: <Target className="h-3.5 w-3.5" />,
    pct,
    primaryStat: `${goals.length} active goal${goals.length !== 1 ? "s" : ""}`,
    secondaryStat: `${totalSteps} total steps`,
    color: "rose", accentClass: "bg-rose-500",
  };
}

function buildFitnessProgress(prGoals: ReturnType<typeof readPRCache>): ModuleProgress {
  const hasData = prGoals.some((g) => g.history.length > 0);
  if (!hasData) {
    return {
      id: "fitness", label: "Fitness", href: "/app/fitness",
      icon: <Dumbbell className="h-3.5 w-3.5" />,
      pct: 0, primaryStat: "No PRs yet",
      color: "violet", accentClass: "bg-violet-500",
    };
  }
  const liftsWithData = prGoals.filter((g) => g.history.length > 0);
  const avgPct = Math.round(
    liftsWithData.reduce((sum, g) => sum + progressPct(currentBest(g.history), g.goal), 0) /
    liftsWithData.length,
  );
  const weekAgoISO = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const recentPRs = prGoals.reduce(
    (count, g) => count + g.history.filter((e) => e.date >= weekAgoISO).length, 0,
  );
  const topLift = liftsWithData.reduce((top, g) =>
    progressPct(currentBest(g.history), g.goal) > progressPct(currentBest(top.history), top.goal) ? g : top,
  );
  const topBest = currentBest(topLift.history);
  return {
    id: "fitness", label: "Fitness", href: "/app/fitness",
    icon: <Dumbbell className="h-3.5 w-3.5" />,
    pct: avgPct,
    primaryStat: `${recentPRs} PR${recentPRs !== 1 ? "s" : ""} this week`,
    secondaryStat: topBest !== null ? `Best: ${topLift.label} ${fmtValue(topBest, topLift.unit)}` : undefined,
    color: "violet", accentClass: "bg-violet-500",
  };
}

function buildNutritionProgress(log: Awaited<ReturnType<typeof loadNutritionLog>>): ModuleProgress {
  const mealsLogged = Object.values(log.eaten ?? {}).filter(Boolean).length;
  const customCount = (log.customEntries ?? []).length;
  const itemsLogged = mealsLogged + customCount;
  const pct = Math.min(Math.round((itemsLogged / 4) * 100), 100);
  return {
    id: "nutrition", label: "Nutrition", href: "/app/nutrition",
    icon: <Apple className="h-3.5 w-3.5" />,
    pct,
    primaryStat: `${itemsLogged} item${itemsLogged !== 1 ? "s" : ""} logged`,
    secondaryStat: customCount > 0 ? `${customCount} custom` : undefined,
    color: "orange", accentClass: "bg-orange-500",
  };
}

function buildReadingProgress(inputs: Awaited<ReturnType<typeof loadReadingInputs>>): ModuleProgress {
  const current = inputs.current;
  const totalPages = parseInt(String(current.totalPages)) || 0;
  const currentPage = parseInt(String(current.currentPage)) || 0;
  const pct = totalPages > 0 ? Math.min(Math.round((currentPage / totalPages) * 100), 100) : 0;
  const hasBook = current.title.trim().length > 0;
  const pagesLeft = totalPages - currentPage;
  // streak is stored directly on ReadingInputs — no second Supabase call needed
  const streak = (inputs as { streak?: number }).streak ?? 0;
  return {
    id: "reading", label: "Reading", href: "/app/reading",
    icon: <BookOpen className="h-3.5 w-3.5" />,
    pct,
    primaryStat: hasBook ? `p.${currentPage}/${totalPages}` : "No book set",
    secondaryStat: hasBook && pagesLeft > 0 ? `${pagesLeft} pages left` : hasBook ? "Finished! 🎉" : undefined,
    streak,
    color: "emerald", accentClass: "bg-emerald-500",
  };
}

function buildTodosProgress(todos: Awaited<ReturnType<typeof listTodos>>): ModuleProgress {
  const done = todos.filter((t) => t.done).length;
  const total = todos.length;
  const pct = total === 0 ? 0 : Math.min(Math.round((done / total) * 100), 100);
  return {
    id: "todos", label: "To-do", href: "/app/todos",
    icon: <CheckSquare className="h-3.5 w-3.5" />,
    pct,
    primaryStat: total === 0 ? "All clear!" : `${done}/${total} done`,
    secondaryStat: total > 0 && done === total ? "All complete 🎉" : undefined,
    color: "sky", accentClass: "bg-sky-500",
  };
}

function buildScheduleProgress(
  log: Awaited<ReturnType<typeof loadScheduleLog>>,
  templates: Awaited<ReturnType<typeof loadScheduleTemplates>>,
): ModuleProgress {
  const blocks = templates[log.view] ?? [];
  const total = blocks.length;
  const done = log.completed.length;
  const pct = total === 0 ? 0 : Math.min(Math.round((done / total) * 100), 100);
  return {
    id: "schedule", label: "Schedule", href: "/app/schedule",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
    pct,
    primaryStat: total === 0 ? "No blocks today" : `${done}/${total} blocks`,
    secondaryStat: log.view === "wfh" ? "WFH day" : log.view === "office" ? "Office day" : "Weekend",
    color: "amber", accentClass: "bg-amber-500",
  };
}

// ── Seed: read all caches synchronously — zero network, instant paint ─────────

function seedProgress(enabledModules: Set<string>): ModuleProgress[] {
  const results: ModuleProgress[] = [];
  try {
    if (enabledModules.has("goals")) {
      const goals = seedUserGoals();
      if (goals.length > 0) results.push(buildGoalsProgress(goals));
    }
    if (enabledModules.has("fitness")) {
      const prGoals = readPRCache();
      if (prGoals.length > 0) results.push(buildFitnessProgress(prGoals));
    }
    if (enabledModules.has("nutrition")) {
      const log = seedNutritionLog?.();
      if (log) results.push(buildNutritionProgress(log));
    }
    if (enabledModules.has("reading")) {
      const inputs = seedReadingInputs?.();
      if (inputs) results.push(buildReadingProgress(inputs));
    }
    if (enabledModules.has("todos")) {
      const todos = seedTodos?.();
      if (todos) results.push(buildTodosProgress(todos));
    }
    if (enabledModules.has("schedule")) {
      const log = seedScheduleLog?.();
      const templates = seedScheduleTemplates?.();
      if (log && templates) results.push(buildScheduleProgress(log, templates));
    }
  } catch { /* ignore — seed is best-effort */ }

  const ORDER = ["goals", "fitness", "nutrition", "reading", "todos", "schedule"];
  return results.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
}

// ── Async fetch: hits Supabase, updates silently in background ────────────────

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
      results.push(buildFitnessProgress(await loadPRGoals()));
    })(),
    (async () => {
      if (!enabledModules.has("nutrition")) return;
      results.push(buildNutritionProgress(await loadNutritionLog()));
    })(),
    (async () => {
      if (!enabledModules.has("reading")) return;
      // Single fetch — streak is on ReadingInputs directly, no second call needed
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

  const ORDER = ["goals", "fitness", "nutrition", "reading", "todos", "schedule"];
  return results.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
}

// ── UI components ─────────────────────────────────────────────────────────────

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

type StarterAction = {
  id: string;
  label: string;
  sub: string;
  href: string;
  icon: React.ReactNode;
  accentClass: string;
};

function getStarterActions(enabledModules: Set<string>): StarterAction[] {
  const actions: StarterAction[] = [];

  if (enabledModules.has("goals")) {
    actions.push({
      id: "goals",
      label: "Create your first goal",
      sub: "Break a big goal into steps",
      href: "/app/goals",
      icon: <Target className="h-4 w-4" />,
      accentClass: "bg-rose-500/10 text-rose-500",
    });
  }

  if (enabledModules.has("nutrition")) {
    actions.push({
      id: "nutrition",
      label: "Log your first meal",
      sub: "Start your daily nutrition streak",
      href: "/app/nutrition",
      icon: <Apple className="h-4 w-4" />,
      accentClass: "bg-orange-500/10 text-orange-500",
    });
  }

  if (enabledModules.has("reading")) {
    actions.push({
      id: "reading",
      label: "Add your current book",
      sub: "Track pages and build momentum",
      href: "/app/reading",
      icon: <BookOpen className="h-4 w-4" />,
      accentClass: "bg-emerald-500/10 text-emerald-500",
    });
  }

  if (enabledModules.has("fitness")) {
    actions.push({
      id: "fitness",
      label: "Add a PR goal",
      sub: "Track your first lift or skill",
      href: "/app/fitness",
      icon: <Dumbbell className="h-4 w-4" />,
      accentClass: "bg-violet-500/10 text-violet-500",
    });
  }

  if (enabledModules.has("todos")) {
    actions.push({
      id: "todos",
      label: "Add a to-do",
      sub: "Capture one thing to get done",
      href: "/app/todos",
      icon: <CheckSquare className="h-4 w-4" />,
      accentClass: "bg-sky-500/10 text-sky-500",
    });
  }

  if (enabledModules.has("schedule")) {
    actions.push({
      id: "schedule",
      label: "Set today’s schedule",
      sub: "Create structure for the day",
      href: "/app/schedule",
      icon: <CalendarDays className="h-4 w-4" />,
      accentClass: "bg-amber-500/10 text-amber-500",
    });
  }

  return actions.slice(0, 3);
}

function EmptyProgressState({
  enabledModules,
}: {
  enabledModules: Set<string>;
}) {
  const actions = getStarterActions(enabledModules);

  return (
    <div className="space-y-4 rounded-xl border border-dashed bg-card/30 p-4">
      <div>
        <p className="text-sm font-semibold">Start filling your dashboard</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          As you log meals, goals, reading, workouts, and tasks, your daily
          progress will appear here.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.href}
            className="group flex items-center gap-3 rounded-xl border bg-card px-3 py-3 transition-all hover:shadow-sm hover:ring-1 hover:ring-border"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.accentClass}`}
            >
              {action.icon}
            </span>

            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">
                {action.label}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {action.sub}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


function OverallRing({ modules }: { modules: ModuleProgress[] }) {
  if (modules.length === 0) return null;
  const avg = Math.round(modules.reduce((s, m) => s + m.pct, 0) / modules.length);
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
            cx="20" cy="20" r="18" fill="none" strokeWidth="3"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="stroke-violet-500 transition-all duration-700"
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

// ── Main component ────────────────────────────────────────────────────────────

function LifeProgressCardInner() {
  const { modules: enabledModules } = useEnabledModules();

  // Seed synchronously from localStorage — card paints instantly with cached data
  const [progress, setProgress] = useState<ModuleProgress[]>(() =>
    seedProgress(enabledModules)
  );
  // Only show skeletons on very first load when cache is empty
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

    // Initial fetch — runs in background, never blanks existing content
    void refresh();

    // On module data changes: update silently (no loading flash)
    const handleChange = () => { void refresh(); };

    const events = [
      "fitness:changed",
      "nutrition:changed",
      "todos:changed",
      "schedule:changed",
      READING_CHANGED_EVENT,
      "goal_module:changed",
      "goals:changed",
    ];
    events.forEach((e) => window.addEventListener(e, handleChange));

    return () => {
      cancelled = true;
      events.forEach((e) => window.removeEventListener(e, handleChange));
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
              Today's progress
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground/50">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "short",
            })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <SkeletonTile key={i} />
            ))}
          </div>
        ) : progress.length > 0 ? (
          <div className="flex items-start gap-5">
            <div className="hidden shrink-0 sm:flex">
              <OverallRing modules={progress} />
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {progress.map((item) => (
                <ModuleTile key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyProgressState enabledModules={enabledModules} />
        )}
      </CardContent>
    </Card>
  );
}

export function LifeProgressCard() {
  return (
    <ErrorBoundary
      variant="card"
      fallback={(error, reset) => (
        <CardErrorFallback error={error} onRetry={reset} label="Life Progress" colSpan="lg:col-span-12" />
      )}
    >
      <LifeProgressCardInner />
    </ErrorBoundary>
  );
}