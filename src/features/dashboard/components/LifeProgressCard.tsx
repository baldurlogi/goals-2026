import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Target, Dumbbell, Apple, BookOpen, CheckSquare, CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  loadPRGoals,
  currentBest,
  progressPct,
  fmtValue,
} from "@/features/fitness/fitnessStorage";
import { loadNutritionLog } from "@/features/nutrition/nutritionStorage";
import { loadUserGoals, seedUserGoals } from "@/features/goals/userGoalStorage";
import { loadReadingInputs, READING_CHANGED_EVENT } from "@/features/reading/readingStorage";
import { loadModuleState } from "@/features/goals/modules/goalModuleStorage";
import { listTodos } from "@/features/todos/todoStorage";
import { loadScheduleLog, loadScheduleTemplates } from "@/features/schedule/scheduleStorage";
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

async function buildProgress(enabledModules: Set<string>): Promise<ModuleProgress[]> {
  const results: ModuleProgress[] = [];

  await Promise.allSettled([
    (async () => {
      if (!enabledModules.has("goals")) return;

      const goals = await loadUserGoals();
      if (goals.length === 0) {
        results.push({
          id: "goals",
          label: "Goals",
          href: "/app/goals",
          icon: <Target className="h-3.5 w-3.5" />,
          pct: 0,
          primaryStat: "No goals yet",
          color: "rose",
          accentClass: "bg-rose-500",
        });
        return;
      }

      const totalSteps = goals.reduce((s, g) => s + g.steps.length, 0);
      const pct =
        totalSteps === 0
          ? 0
          : Math.min(
              Math.round(
                (goals.filter((g) => g.steps.length > 0).length / goals.length) * 100,
              ),
              100,
            );

      results.push({
        id: "goals",
        label: "Goals",
        href: "/app/goals",
        icon: <Target className="h-3.5 w-3.5" />,
        pct,
        primaryStat: `${goals.length} active goal${goals.length !== 1 ? "s" : ""}`,
        secondaryStat: `${totalSteps} total steps`,
        color: "rose",
        accentClass: "bg-rose-500",
      });
    })(),

    (async () => {
      if (!enabledModules.has("fitness")) return;

      const prGoals = await loadPRGoals();
      const hasData = prGoals.some((goal) => goal.history.length > 0);

      if (!hasData) {
        results.push({
          id: "fitness",
          label: "Fitness",
          href: "/app/fitness",
          icon: <Dumbbell className="h-3.5 w-3.5" />,
          pct: 0,
          primaryStat: "No PRs yet",
          color: "violet",
          accentClass: "bg-violet-500",
        });
        return;
      }

      const liftsWithData = prGoals.filter((goal) => goal.history.length > 0);

      const avgPct = Math.round(
        liftsWithData.reduce((sum, goal) => {
          const best = currentBest(goal.history);
          return sum + progressPct(best, goal.goal);
        }, 0) / liftsWithData.length,
      );

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString().slice(0, 10);

      const recentPRs = prGoals.reduce((count, goal) => {
        return count + goal.history.filter((entry) => entry.date >= weekAgoISO).length;
      }, 0);

      const topLift = liftsWithData.reduce((top, goal) => {
        const topPct = progressPct(currentBest(top.history), top.goal);
        const goalPct = progressPct(currentBest(goal.history), goal.goal);
        return goalPct > topPct ? goal : top;
      });

      const topBest = currentBest(topLift.history);

      results.push({
        id: "fitness",
        label: "Fitness",
        href: "/app/fitness",
        icon: <Dumbbell className="h-3.5 w-3.5" />,
        pct: avgPct,
        primaryStat: `${recentPRs} PR${recentPRs !== 1 ? "s" : ""} this week`,
        secondaryStat:
          topBest !== null
            ? `Best: ${topLift.label} ${fmtValue(topBest, topLift.unit)}`
            : undefined,
        color: "violet",
        accentClass: "bg-violet-500",
      });
    })(),

    (async () => {
      if (!enabledModules.has("nutrition")) return;

      const log = await loadNutritionLog();
      const mealsLogged = Object.values(log.eaten ?? {}).filter(Boolean).length;
      const customCount = (log.customEntries ?? []).length;
      const itemsLogged = mealsLogged + customCount;
      const pct = Math.min(Math.round((itemsLogged / 4) * 100), 100);

      results.push({
        id: "nutrition",
        label: "Nutrition",
        href: "/app/nutrition",
        icon: <Apple className="h-3.5 w-3.5" />,
        pct,
        primaryStat: `${itemsLogged} item${itemsLogged !== 1 ? "s" : ""} logged`,
        secondaryStat: customCount > 0 ? `${customCount} custom` : undefined,
        color: "orange",
        accentClass: "bg-orange-500",
      });
    })(),

    (async () => {
      if (!enabledModules.has("reading")) return;

      const inputs = await loadReadingInputs();
      const current = inputs.current;
      const totalPages = parseInt(current.totalPages) || 0;
      const currentPage = parseInt(current.currentPage) || 0;
      const pct =
        totalPages > 0
          ? Math.min(Math.round((currentPage / totalPages) * 100), 100)
          : 0;

      let streak = 0;
      try {
        const streakState = await loadModuleState<{
          streak: number;
          lastReadISO: string | null;
        }>("reading", "reading_streak", { streak: 0, lastReadISO: null });

        streak = streakState?.streak ?? 0;
      } catch {
        // ignore
      }

      const hasBook = current.title.trim().length > 0;
      const pagesLeft = totalPages - currentPage;

      results.push({
        id: "reading",
        label: "Reading",
        href: "/app/reading",
        icon: <BookOpen className="h-3.5 w-3.5" />,
        pct,
        primaryStat: hasBook ? `p.${currentPage}/${totalPages}` : "No book set",
        secondaryStat:
          hasBook && pagesLeft > 0
            ? `${pagesLeft} pages left`
            : hasBook
              ? "Finished! 🎉"
              : undefined,
        streak,
        color: "emerald",
        accentClass: "bg-emerald-500",
      });
    })(),

    (async () => {
      if (!enabledModules.has("todos")) return;

      const todos = await listTodos();
      const done = todos.filter((t) => t.done).length;
      const total = todos.length;
      const pct =
        total === 0 ? 0 : Math.min(Math.round((done / total) * 100), 100);

      results.push({
        id: "todos",
        label: "To-do",
        href: "/app/todos",
        icon: <CheckSquare className="h-3.5 w-3.5" />,
        pct,
        primaryStat: total === 0 ? "All clear!" : `${done}/${total} done`,
        secondaryStat: total > 0 && done === total ? "All complete 🎉" : undefined,
        color: "sky",
        accentClass: "bg-sky-500",
      });
    })(),

    (async () => {
      if (!enabledModules.has("schedule")) return;

      const [log, templates] = await Promise.all([
        loadScheduleLog(),
        loadScheduleTemplates(),
      ]);

      const blocks = templates[log.view] ?? [];
      const total = blocks.length;
      const done = log.completed.length;
      const pct =
        total === 0 ? 0 : Math.min(Math.round((done / total) * 100), 100);

      results.push({
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
      });
    })(),
  ]);

  const ORDER = ["goals", "fitness", "nutrition", "reading", "todos", "schedule"];
  return results.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
}

function seedProgress(): ModuleProgress[] {
  try {
    const goals = seedUserGoals();
    if (goals.length > 0) {
      const totalSteps = goals.reduce((s, g) => s + g.steps.length, 0);

      return [
        {
          id: "goals",
          label: "Goals",
          href: "/app/goals",
          icon: <Target className="h-3.5 w-3.5" />,
          pct: Math.min(
            (goals.filter((g) => g.steps.length > 0).length / goals.length) * 100,
            100,
          ),
          primaryStat: `${goals.length} active goal${goals.length !== 1 ? "s" : ""}`,
          secondaryStat: `${totalSteps} total steps`,
          color: "rose",
          accentClass: "bg-rose-500",
        },
      ];
    }
  } catch {
    // ignore
  }

  return [];
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
  const [progress, setProgress] = useState<ModuleProgress[]>(seedProgress);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const events = [
      "fitness:changed",
      "nutrition:changed",
      "todos:changed",
      "schedule:changed",
      READING_CHANGED_EVENT,
      "goal_module:changed",
    ];

    async function refresh() {
      await Promise.resolve();

      if (cancelled) return;

      if (enabledModules.size === 0) {
        setProgress([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const data = await buildProgress(enabledModules);
      if (cancelled) return;

      setProgress(data);
      setLoading(false);
    }

    const handleChange = () => {
      void refresh();
    };

    void refresh();
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
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        <div className="flex items-start gap-5">
          {!loading && progress.length > 0 && (
            <div className="hidden sm:flex shrink-0">
              <OverallRing modules={progress} />
            </div>
          )}

          <div className="flex-1 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 min-w-0">
            {loading
              ? Array.from({ length: skeletonCount }).map((_, i) => (
                  <SkeletonTile key={i} />
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