import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAISystemContext } from '@/features/ai/buildAIContext';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import { readProfileCache } from '@/features/onboarding/profileStorage';
import { getLocalDateKey } from '@/hooks/useTodayDate';
import {
  loadPhase,
  getLoggedMacros,
  type NutritionLog,
} from '@/features/nutrition/nutritionStorage';
import { getTargets } from '@/features/nutrition/nutritionData';
import {
  loadReadingInputs,
  getWeeklyReadingSummary,
} from '@/features/reading/readingStorage';
import { loadPRGoals } from '@/features/fitness/prGoalStorage';
import {
  getDaysSinceWorkout,
  getRecentPRCount,
  getStrongestLiftLabel,
} from '@/features/fitness/selectors';
import { REST_LABELS } from '@/features/fitness/constants';
import { loadScheduleTemplates } from '@/features/schedule/scheduleStorage';
import { getTodoWeeklySummary, type Todo } from '@/features/todos/todoStorage';

const SUPABASE_FN =
  'https://jvtpemjrswfwsiwkhreq.supabase.co/functions/v1/hyper-responder';

const WEEKLY_REPORT_CACHE_KEY = 'cache:weekly-report:latest:v1';

type Completeness = 'complete' | 'partial' | 'unknown';

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

type Status = 'idle' | 'loading' | 'generating' | 'error';

type WeeklyDataPayload = {
  weekStart: string;
  weekEnd: string;
  modules: string[];
  profile: {
    displayName: string | null;
    activityLevel: string | null;
    dailyReadingGoal: number | null;
  };
  goals?: {
    total: number;
    stepsCompletedThisWeek: number;
    overdueSteps: number;
    topGoals: Array<{ title: string; priority: string; pct: number }>;
    dataCompleteness: Completeness;
  };
  fitness?: {
    workoutsThisWeek: number | null;
    daysSinceLastWorkout: number | null;
    prsThisWeek: number;
    strongestLift: string | null;
    dataCompleteness: Completeness;
  };
  nutrition?: {
    avgCaloriesLogged: number;
    calorieTarget: number | null;
    avgProteinLogged: number;
    proteinTarget: number | null;
    daysLogged: number;
    dataCompleteness: Completeness;
  };
  reading?: {
    currentBook: string | null;
    streak: number;
    pagesRead: number | null;
    dailyGoalPages: number;
    daysRead: number;
    dataCompleteness: Completeness;
  };
  todos?: {
    completedThisWeek: number | null;
    totalCreatedThisWeek: number;
    completedTotal: number;
    openCount: number;
    dataCompleteness: Completeness;
  };
  schedule?: {
    blocksCompletedThisWeek: number;
    totalBlocksThisWeek: number;
    activeDays: number;
    dataCompleteness: Completeness;
  };
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

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function diffDaysFromToday(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - target.getTime()) / 86400000);
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getCurrentWeekStart(): string {
  return toLocalDateStr(getMondayOf(new Date()));
}

export function getCurrentWeekEnd(): string {
  const monday = getMondayOf(new Date());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(0, 0, 0, 0);
  return toLocalDateStr(sunday);
}

export function isSunday(): boolean {
  return new Date().getDay() === 0;
}

function summarizeGoals(goals: Array<Record<string, any>>) {
  const doneMap =
    readJson<Record<string, Record<string, boolean>>>('goals:done:v1') ?? {};
  const history = readJson<Array<{ date?: string }>>('goals:step-history:v1') ?? [];

  const today = getLocalDateKey();
  const weekStart = getCurrentWeekStart();

  const topGoals = goals.slice(0, 5).map((goal) => {
    const steps = Array.isArray(goal.steps) ? goal.steps : [];
    const done = doneMap[String(goal.id)] ?? {};
    const doneCount = steps.filter((step: any) => done[String(step.id)]).length;
    const pct = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

    return {
      title: String(goal.title ?? 'Untitled goal'),
      priority: String(goal.priority ?? 'medium'),
      pct,
    };
  });

  const overdueSteps = goals.reduce((count, goal) => {
    const steps = Array.isArray(goal.steps) ? goal.steps : [];
    const done = doneMap[String(goal.id)] ?? {};

    return (
      count +
      steps.filter((step: any) => {
        const idealFinish =
          typeof step?.idealFinish === 'string' ? step.idealFinish : null;
        if (!idealFinish) return false;
        if (done[String(step.id)]) return false;
        return idealFinish < today;
      }).length
    );
  }, 0);

  const stepsCompletedThisWeek = history.filter((entry) => {
    const date = typeof entry?.date === 'string' ? entry.date : '';
    return date >= weekStart && date <= today;
  }).length;

  return {
    total: goals.length,
    stepsCompletedThisWeek,
    overdueSteps,
    topGoals,
    dataCompleteness: 'complete' as Completeness,
  };
}

function tryReadWeeklySplitSummary(
  weekStart: string,
  weekEnd: string,
): {
  workoutsThisWeek: number;
  daysSinceLastWorkout: number | null;
} | null {
  const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !/fitness|split/i.test(key)) continue;

    const parsed = readJson<any>(key);
    if (!parsed || typeof parsed !== 'object' || !parsed.days) continue;

    const days = parsed.days as Record<string, any>;
    if (!dayKeys.every((day) => typeof days?.[day] === 'object')) continue;

    let workoutsThisWeek = 0;
    let lastCompletedDate: string | null = null;

    for (const dayKey of dayKeys) {
      const item = days[dayKey];
      const label = String(item?.label ?? '').trim().toLowerCase();
      const completedDate =
        typeof item?.completedDate === 'string' ? item.completedDate : null;

      if (!completedDate) continue;
      if (label && REST_LABELS.has(label)) continue;

      if (completedDate >= weekStart && completedDate <= weekEnd) {
        workoutsThisWeek += 1;
      }

      if (!lastCompletedDate || completedDate > lastCompletedDate) {
        lastCompletedDate = completedDate;
      }
    }

    return {
      workoutsThisWeek,
      daysSinceLastWorkout: diffDaysFromToday(lastCompletedDate),
    };
  }

  return null;
}

async function collectFitnessData(
  modules: Set<string>,
  weekStart: string,
  weekEnd: string,
) {
  if (!modules.has('fitness')) return undefined;

  const prGoals = await loadPRGoals();
  const splitSummary = tryReadWeeklySplitSummary(weekStart, weekEnd);

  const uniqueWorkoutDates = new Set<string>();
  for (const goal of prGoals) {
    const history = Array.isArray(goal.history) ? goal.history : [];
    for (const entry of history) {
      if (entry?.date >= weekStart && entry?.date <= weekEnd) {
        uniqueWorkoutDates.add(entry.date);
      }
    }
  }

  return {
    workoutsThisWeek:
      splitSummary?.workoutsThisWeek ?? uniqueWorkoutDates.size ?? null,
    daysSinceLastWorkout:
      splitSummary?.daysSinceLastWorkout ?? getDaysSinceWorkout(prGoals),
    prsThisWeek: getRecentPRCount(prGoals, 7),
    strongestLift: getStrongestLiftLabel(prGoals),
    dataCompleteness: splitSummary
      ? ('complete' as Completeness)
      : prGoals.length > 0
        ? ('partial' as Completeness)
        : ('unknown' as Completeness),
  };
}

function hasNutritionData(log: NutritionLog): boolean {
  const eatenValues = Object.values(log.eaten ?? {});
  return eatenValues.some(Boolean) || (log.customEntries?.length ?? 0) > 0;
}

async function collectNutritionData(
  modules: Set<string>,
  weekStart: string,
  weekEnd: string,
) {
  if (!modules.has('nutrition')) return undefined;

  const phase = await loadPhase();
  const targets = getTargets(phase);

  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('log_date, eaten, custom_entries')
    .gte('log_date', weekStart)
    .lte('log_date', weekEnd)
    .order('log_date', { ascending: true });

  if (error) {
    console.warn('collectNutritionData error:', error);
    return {
      avgCaloriesLogged: 0,
      calorieTarget: targets.cal,
      avgProteinLogged: 0,
      proteinTarget: targets.protein,
      daysLogged: 0,
      dataCompleteness: 'unknown' as Completeness,
    };
  }

  const logs: NutritionLog[] = (data ?? []).map((row) => ({
    date: row.log_date,
    eaten: (row.eaten ?? {}) as NutritionLog['eaten'],
    customEntries: (row.custom_entries ?? []) as NutritionLog['customEntries'],
  }));

  const loggedDays = logs.filter(hasNutritionData);
  const totals = loggedDays.reduce(
    (acc, log) => {
      const macros = getLoggedMacros(log);
      return {
        cal: acc.cal + macros.cal,
        protein: acc.protein + macros.protein,
      };
    },
    { cal: 0, protein: 0 },
  );

  const daysLogged = loggedDays.length;

  return {
    avgCaloriesLogged: daysLogged > 0 ? Math.round(totals.cal / daysLogged) : 0,
    calorieTarget: targets.cal,
    avgProteinLogged:
      daysLogged > 0 ? Math.round(totals.protein / daysLogged) : 0,
    proteinTarget: targets.protein,
    daysLogged,
    dataCompleteness:
      daysLogged >= 5
        ? ('complete' as Completeness)
        : daysLogged > 0
          ? ('partial' as Completeness)
          : ('unknown' as Completeness),
  };
}

async function collectReadingData(
  modules: Set<string>,
  weekStart: string,
  weekEnd: string,
) {
  if (!modules.has('reading')) return undefined;

  const inputs = await loadReadingInputs();
  const summary = getWeeklyReadingSummary(inputs, weekStart, weekEnd);

  const hasOnlyThinSignal =
    summary.daysRead <= 1 && (inputs.streak ?? 0) > 1 && summary.pagesRead === 0;

  return {
    currentBook: inputs.current.title.trim() || null,
    streak: inputs.streak ?? 0,
    pagesRead: hasOnlyThinSignal ? null : summary.pagesRead,
    dailyGoalPages: summary.goalPages,
    daysRead: summary.daysRead,
    dataCompleteness: summary.dataCompleteness,
  };
}

async function collectTodosData(
  modules: Set<string>,
  weekStart: string,
  weekEnd: string,
) {
  if (!modules.has('todos')) return undefined;

  const { data, error } = await supabase
    .from('todos')
    .select('id, text, done, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('collectTodosData error:', error);
    return {
      completedThisWeek: null,
      totalCreatedThisWeek: 0,
      completedTotal: 0,
      openCount: 0,
      dataCompleteness: 'unknown' as Completeness,
    };
  }

  const todos = (data ?? []) as Todo[];
  return getTodoWeeklySummary(weekStart, weekEnd, todos);
}

async function collectScheduleData(
  modules: Set<string>,
  weekStart: string,
  weekEnd: string,
) {
  if (!modules.has('schedule')) return undefined;

  const templates = await loadScheduleTemplates();

  const { data, error } = await supabase
    .from('schedule_logs')
    .select('log_date, view, completed')
    .gte('log_date', weekStart)
    .lte('log_date', weekEnd)
    .order('log_date', { ascending: true });

  if (error) {
    console.warn('collectScheduleData error:', error);
    return {
      blocksCompletedThisWeek: 0,
      totalBlocksThisWeek: 0,
      activeDays: 0,
      dataCompleteness: 'unknown' as Completeness,
    };
  }

  let blocksCompletedThisWeek = 0;
  let totalBlocksThisWeek = 0;

  for (const row of data ?? []) {
    const rawView = row?.view;
    const view: keyof typeof templates =
      rawView === 'office' || rawView === 'weekend' || rawView === 'wfh'
        ? rawView
        : 'wfh';

    const blocks = templates[view]?.length ?? 0;
    const completed = Array.isArray(row?.completed) ? row.completed.length : 0;

    totalBlocksThisWeek += blocks;
    blocksCompletedThisWeek += completed;
  }

  const activeDays = (data ?? []).length;

  return {
    blocksCompletedThisWeek,
    totalBlocksThisWeek,
    activeDays,
    dataCompleteness:
      activeDays >= 5
        ? ('complete' as Completeness)
        : activeDays > 0
          ? ('partial' as Completeness)
          : ('unknown' as Completeness),
  };
}

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
  const weekEnd = getCurrentWeekEnd();

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

      const [goals, fitness, nutrition, reading, todos, schedule] =
        await Promise.all([
          loadUserGoals(),
          collectFitnessData(modules, weekStart, weekEnd),
          collectNutritionData(modules, weekStart, weekEnd),
          collectReadingData(modules, weekStart, weekEnd),
          collectTodosData(modules, weekStart, weekEnd),
          collectScheduleData(modules, weekStart, weekEnd),
        ]);

      const profile = readProfileCache();

      let userContext = '';
      try {
        userContext = await getAISystemContext();
      } catch {
        // non-fatal
      }

      const enabledModulesRaw = localStorage.getItem('cache:enabled_modules:v1');
      const enabledModules: Set<string> = enabledModulesRaw
        ? new Set(JSON.parse(enabledModulesRaw))
        : modules;

      const weeklyData: WeeklyDataPayload = {
        weekStart,
        weekEnd,
        modules: Array.from(enabledModules),
        profile: {
          displayName: profile?.display_name ?? null,
          activityLevel: profile?.activity_level ?? null,
          dailyReadingGoal: profile?.daily_reading_goal ?? null,
        },
        goals: summarizeGoals(goals as Array<Record<string, any>>),
        fitness,
        nutrition,
        reading,
        todos,
        schedule,
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
  }, [modules, weekEnd, weekStart]);

  return {
    report,
    status,
    error,
    limitHit,
    usage,
    generate,
    weekStart,
    weekEnd,
    isThisWeek: report?.weekStart === weekStart,
    isSunday: isSunday(),
  };
}