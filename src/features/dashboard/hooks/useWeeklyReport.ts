/**
 * useWeeklyReport.ts
 *
 * Manages the AI Weekly Life Report:
 * - Loads the latest report from Supabase
 * - Builds weeklyData payload from all module stores
 * - Calls hyper-responder with action: "weekly-report"
 * - Stores result back to Supabase
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAISystemContext } from '@/features/ai/buildAIContext';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import { readProfileCache } from '@/features/onboarding/profileStorage';
import { getLocalDateKey } from '@/hooks/useTodayDate';
const SUPABASE_FN =
  'https://jvtpemjrswfwsiwkhreq.supabase.co/functions/v1/hyper-responder';

// ── Report shape (mirrors edge function output) ───────────────────────────────

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

// ── Week helpers ──────────────────────────────────────────────────────────────

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

/** Returns true if today is Sunday (day 0) */
export function isSunday(): boolean {
  return new Date().getDay() === 0;
}

// ── Data collectors (reads from localStorage caches) ─────────────────────────

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

    // Count done steps from localStorage event history if available
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
    const data = JSON.parse(raw);
    const profile = readProfileCache();

    const weekStart = getCurrentWeekStart();
    const sessions: Array<{ date: string; minutes: number; pages: number }> =
      data.sessions ?? [];
    const weekSessions = sessions.filter(
      (s: { date: string }) => s.date >= weekStart,
    );
    const minutesThisWeek = weekSessions.reduce(
      (sum: number, s: { minutes: number }) => sum + (s.minutes ?? 0),
      0,
    );
    const pagesRead = weekSessions.reduce(
      (sum: number, s: { pages: number }) => sum + (s.pages ?? 0),
      0,
    );

    return {
      minutesThisWeek,
      targetMinutesPerDay: profile?.daily_reading_goal ?? 20,
      streak: data.streak ?? 0,
      currentBook: data.currentBook?.title ?? null,
      pagesRead,
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

// ── Hook ──────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'generating' | 'error';

export function useWeeklyReport(modules: Set<string>) {
  const [report, setReport] = useState<WeeklyReportRecord | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    prompts_used: number;
    monthly_limit: number;
    remaining: number;
  } | null>(null);

  const weekStart = getCurrentWeekStart();

  // Load latest report from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setStatus('idle');
          return;
        }

        const { data, error: dbErr } = await supabase
          .from('ai_weekly_reports')
          .select('id, week_start, report, created_at')
          .eq('user_id', user.id)
          .order('week_start', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dbErr || !data) {
          setStatus('idle');
          return;
        }
        if (cancelled) return;

        setReport({
          id: data.id,
          weekStart: data.week_start,
          report: data.report as WeeklyReport,
          createdAt: data.created_at,
        });
        setStatus('idle');
      } catch {
        if (!cancelled) setStatus('idle');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const generate = useCallback(async () => {
    setStatus('generating');
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not signed in');

      // Load goals from Supabase directly for accuracy
      const goals = await loadUserGoals();
      const profile = readProfileCache();

      let userContext = '';
      try {
        userContext = await getAISystemContext();
      } catch {
        /* non-fatal */
      }

      // Get enabled modules list
      const enabledModulesRaw = localStorage.getItem(
        'cache:enabled_modules:v1',
      );
      const enabledModules: Set<string> = enabledModulesRaw
        ? new Set(JSON.parse(enabledModulesRaw))
        : modules;

      // Build weeklyData from local caches
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
          stepsCompletedThisWeek:
            collectGoalsData(enabledModules)?.stepsCompletedThisWeek ?? 0,
          overdueSteps: collectGoalsData(enabledModules)?.overdueSteps ?? 0,
          topGoals: goals.slice(0, 5).map((g) => ({
            title: g.title,
            priority: g.priority,
            pct:
              g.steps.length === 0
                ? 0
                : Math.round(
                    (g.steps.filter(() => false).length / g.steps.length) * 100,
                  ),
          })),
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
        throw new Error(d.message ?? 'Monthly AI limit reached.');
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
        createdAt: getLocalDateKey(),
      };

      setReport(newRecord);
      if (data.usage) setUsage(data.usage);
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
    usage,
    generate,
    weekStart,
    isThisWeek: report?.weekStart === weekStart,
    isSunday: isSunday(),
  };
}
