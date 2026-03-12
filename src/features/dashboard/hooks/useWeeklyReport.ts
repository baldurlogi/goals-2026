import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAISystemContext } from '@/features/ai/buildAIContext';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import { readProfileCache } from '@/features/onboarding/profileStorage';
import { getLocalDateKey } from '@/hooks/useTodayDate';

const SUPABASE_FN =
  'https://jvtpemjrswfwsiwkhreq.supabase.co/functions/v1/hyper-responder';

const WEEKLY_REPORT_CACHE_KEY = 'cache:weekly-report:latest:v1';

export type ModuleScore = {
  module: string;
  label: string;
  emoji: string;
  score: number;
  oneliner: string;
};

export type ReportWin = { title: string; detail: string };
export type ReportMiss = { title: string; detail: string };
export type ReportPattern = { title: string; detail: string };
export type ReportFocus = {
  priority: number;
  action: string;
  why: string;
  href: string;
};

export type WeeklyReport = {
  headline: string;
  overallScore: number;
  moduleScores: ModuleScore[];
  wins: ReportWin[];
  missedTargets: ReportMiss[];
  patterns: ReportPattern[];
  nextWeekFocus: ReportFocus[];
  closingNote: string;
};

export type WeeklyReportRecord = {
  id: string;
  weekStart: string;
  report: WeeklyReport;
  createdAt: string;
};

function readLatestReportCache(): WeeklyReportRecord | null {
  try {
    const raw = localStorage.getItem(WEEKLY_REPORT_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as WeeklyReportRecord | null;
    if (!parsed?.id || !parsed?.weekStart || !parsed?.report) return null;

    return parsed;
  } catch {
    return null;
  }
}

function writeLatestReportCache(report: WeeklyReportRecord | null) {
  try {
    if (!report) {
      localStorage.removeItem(WEEKLY_REPORT_CACHE_KEY);
      return;
    }
    localStorage.setItem(WEEKLY_REPORT_CACHE_KEY, JSON.stringify(report));
  } catch {
    // ignore
  }
}

/** Returns the ISO Monday of the given date */
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getCurrentWeekStart(): string {
  return toDateStr(getMondayOf(new Date()));
}

export function getCurrentWeekEnd(): string {
  const monday = getMondayOf(new Date());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return toDateStr(sunday);
}

export function isSunday(): boolean {
  return new Date().getDay() === 0;
}

function collectGoalsData(modules: Set<string>) {
  if (!modules.has('goals')) return undefined;

  try {
    const raw = localStorage.getItem('cache:user_goals:v1');
    if (!raw) return undefined;

    const goals = JSON.parse(raw) as Array<{
      id: string;
      title: string;
      priority: string;
      steps: Array<{ id: string }>;
    }>;

    const doneRaw = localStorage.getItem('goals:done:v1');
    const doneMap: Record<string, Record<string, boolean>> = doneRaw
      ? JSON.parse(doneRaw)
      : {};

    let stepsCompletedThisWeek = 0;
    const overdueSteps = 0;
    const today = getLocalDateKey();
    const weekStart = getCurrentWeekStart();

    const topGoals = goals.slice(0, 5).map((g) => {
      const done = doneMap[g.id] ?? {};
      const doneCount = g.steps.filter((s) => done[s.id]).length;
      const pct =
        g.steps.length === 0
          ? 0
          : Math.round((doneCount / g.steps.length) * 100);

      return { title: g.title, priority: g.priority, pct };
    });

    const historyRaw = localStorage.getItem('goals:step-history:v1');
    if (historyRaw) {
      const history: Array<{ date: string }> = JSON.parse(historyRaw);
      stepsCompletedThisWeek = history.filter(
        (h) => h.date >= weekStart && h.date <= today,
      ).length;
    }

    return {
      total: goals.length,
      stepsCompletedThisWeek,
      overdueSteps,
      topGoals,
    };
  } catch {
    return undefined;
  }
}

function collectFitnessData(modules: Set<string>) {
  if (!modules.has('fitness')) return undefined;

  try {
    const raw = localStorage.getItem('cache:fitness:v1');
    if (!raw) return undefined;

    const data = JSON.parse(raw);
    return {
      workoutsThisWeek: data.workoutsThisWeek ?? 0,
      daysSinceLastWorkout: data.daysSinceLastWorkout ?? null,
      prsThisWeek: data.prsThisWeek ?? 0,
      strongestLift: data.strongestLift ?? null,
    };
  } catch {
    return undefined;
  }
}

function collectNutritionData(modules: Set<string>) {
  if (!modules.has('nutrition')) return undefined;

  try {
    const logRaw = localStorage.getItem('cache:nutrition_log:v1');
    const phaseRaw = localStorage.getItem('cache:nutrition_phase:v1');
    if (!logRaw) return undefined;

    const log: Array<{ date: string; calories: number; protein: number }> =
      JSON.parse(logRaw);
    const phase = phaseRaw ? JSON.parse(phaseRaw) : null;
    const weekStart = getCurrentWeekStart();
    const weekEntries = log.filter((e) => e.date >= weekStart);

    const daysLogged = new Set(weekEntries.map((e) => e.date)).size;
    const avgCal =
      daysLogged > 0
        ? Math.round(
            weekEntries.reduce((s, e) => s + (e.calories ?? 0), 0) / daysLogged,
          )
        : 0;

    const avgProtein =
      daysLogged > 0
        ? Math.round(
            weekEntries.reduce((s, e) => s + (e.protein ?? 0), 0) / daysLogged,
          )
        : 0;

    return {
      avgCaloriesLogged: avgCal,
      calorieTarget: phase?.calorieTarget ?? null,
      avgProteinLogged: avgProtein,
      proteinTarget: phase?.proteinTarget ?? null,
      daysLogged,
    };
  } catch {
    return undefined;
  }
}

function collectReadingData(modules: Set<string>) {
  if (!modules.has('reading')) return undefined;

  try {
    const raw = localStorage.getItem('daily-life:reading:v2');
    if (!raw) return undefined;

    const data = JSON.parse(raw) as {
      current?: { title?: string; currentPage?: string; totalPages?: string };
      dailyGoalPages?: string;
      streak?: number;
      lastReadDate?: string | null;
      completed?: Array<unknown>;
    };

    const profile = readProfileCache();
    const currentPage = Number(data.current?.currentPage ?? 0);
    const totalPages = Math.max(1, Number(data.current?.totalPages ?? 1));
    const pct = Math.round((currentPage / totalPages) * 100);

    return {
      currentBook: data.current?.title ?? null,
      currentPage,
      totalPages,
      pct,
      streak: data.streak ?? 0,
      lastReadDate: data.lastReadDate ?? null,
      dailyGoalPages: Number(
        data.dailyGoalPages ?? profile?.daily_reading_goal ?? 20,
      ),
      booksCompletedTotal: (data.completed ?? []).length,
    };
  } catch {
    return undefined;
  }
}

function collectTodosData(modules: Set<string>) {
  if (!modules.has('todos')) return undefined;

  try {
    const raw = localStorage.getItem('cache:todos:v1');
    if (!raw) return undefined;

    const todos: Array<{ completedAt?: string; createdAt?: string }> =
      JSON.parse(raw);
    const weekStart = getCurrentWeekStart();

    const completedThisWeek = todos.filter(
      (t) => t.completedAt && t.completedAt >= weekStart,
    ).length;

    const totalCreatedThisWeek = todos.filter(
      (t) => t.createdAt && t.createdAt >= weekStart,
    ).length;

    return { completedThisWeek, totalCreatedThisWeek };
  } catch {
    return undefined;
  }
}

function collectScheduleData(modules: Set<string>) {
  if (!modules.has('schedule')) return undefined;

  try {
    const raw = localStorage.getItem('cache:schedule:templates:v1');
    if (!raw) return undefined;

    const data = JSON.parse(raw);
    return {
      blocksCompletedThisWeek: data.blocksCompletedThisWeek ?? 0,
      totalBlocksThisWeek: data.totalBlocksThisWeek ?? 0,
    };
  } catch {
    return undefined;
  }
}

type Status = 'idle' | 'loading' | 'generating' | 'error';

export function useWeeklyReport(modules: Set<string>) {
  const [limitHit, setLimitHit] = useState(false);
  const [report, setReport] = useState<WeeklyReportRecord | null>(() =>
    readLatestReportCache(),
  );
  const [status, setStatus] = useState<Status>(() =>
    readLatestReportCache() ? 'idle' : 'loading',
  );
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    prompts_used: number;
    monthly_limit: number;
    remaining: number;
  } | null>(null);

  const weekStart = getCurrentWeekStart();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!readLatestReportCache()) {
        setStatus('loading');
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) setStatus('idle');
          return;
        }

        const { data, error: dbErr } = await supabase
          .from('ai_weekly_reports')
          .select('id, week_start, report, created_at')
          .eq('user_id', user.id)
          .order('week_start', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (dbErr || !data) {
          setStatus('idle');
          return;
        }

        const latest: WeeklyReportRecord = {
          id: data.id,
          weekStart: data.week_start,
          report: data.report as WeeklyReport,
          createdAt: data.created_at,
        };

        setReport(latest);
        writeLatestReportCache(latest);
        setStatus('idle');
      } catch {
        if (!cancelled) setStatus('idle');
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const generate = useCallback(async () => {
    setStatus('generating');
    setError(null);
    setLimitHit(false);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not signed in');
      }

      const goals = await loadUserGoals();
      const profile = readProfileCache();

      let userContext = '';
      try {
        userContext = await getAISystemContext();
      } catch {
        // non-fatal
      }

      const enabledModulesRaw = localStorage.getItem(
        'cache:enabled_modules:v1',
      );
      const enabledModules: Set<string> = enabledModulesRaw
        ? new Set(JSON.parse(enabledModulesRaw))
        : modules;

      const goalsSummary = collectGoalsData(enabledModules);

      const weeklyData = {
        weekStart,
        weekEnd: getCurrentWeekEnd(),
        modules: Array.from(enabledModules),
        profile: {
          displayName: profile?.display_name ?? null,
          activityLevel: profile?.activity_level ?? null,
          dailyReadingGoal: profile?.daily_reading_goal ?? null,
        },
        goals: {
          total: goals.length,
          stepsCompletedThisWeek: goalsSummary?.stepsCompletedThisWeek ?? 0,
          overdueSteps: goalsSummary?.overdueSteps ?? 0,
          topGoals: goalsSummary?.topGoals ?? [],
        },
        fitness: collectFitnessData(enabledModules),
        nutrition: collectNutritionData(enabledModules),
        reading: collectReadingData(enabledModules),
        todos: collectTodosData(enabledModules),
        schedule: collectScheduleData(enabledModules),
      };

      const res = await fetch(SUPABASE_FN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'weekly-report',
          userContext,
          weeklyData,
        }),
      });

      if (res.status === 403) {
        const d = await res.json().catch(() => ({}));
        throw new Error(
          d.message ?? 'Upgrade to Pro to generate weekly reports.',
        );
      }

      if (res.status === 429) {
        const d = await res.json().catch(() => ({}));
        setLimitHit(true);
        setError(d.message ?? 'Monthly AI limit reached.');
        setStatus('idle');
        return;
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Failed to generate report');
      }

      const data = await res.json();

      const newRecord: WeeklyReportRecord = {
        id: crypto.randomUUID(),
        weekStart,
        report: data.report as WeeklyReport,
        createdAt: new Date().toISOString(),
      };

      setReport(newRecord);
      writeLatestReportCache(newRecord);

      if (data.usage) {
        setUsage(data.usage);
      }

      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setStatus('error');
    }
  }, [weekStart, modules]);

  return {
    report,
    status,
    error,
    limitHit,
    usage,
    generate,
    weekStart,
    isThisWeek: report?.weekStart === weekStart,
    isSunday: isSunday(),
  };
}