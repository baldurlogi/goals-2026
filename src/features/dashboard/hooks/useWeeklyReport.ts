import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getAISystemContext } from "@/features/ai/buildAIContext";
import { loadUserGoals } from "@/features/goals/userGoalStorage";
import type { UserGoal, UserGoalStep } from "@/features/goals/goalTypes";
import { loadProfile } from "@/features/onboarding/profileStorage";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import {
  loadPhase,
  getLoggedMacros,
  type NutritionLog,
} from "@/features/nutrition/nutritionStorage";
import { getTargets } from "@/features/nutrition/nutritionData";
import {
  getActiveUserId,
  getScopedStorageItem,
  removeScopedStorageItem,
  scopedKey,
  writeScopedStorageItem,
} from "@/lib/activeUser";
import {
  loadReadingInputs,
  getWeeklyReadingSummary,
} from "@/features/reading/readingStorage";
import { loadPRGoals } from "@/features/fitness/prGoalStorage";
import {
  getDaysSinceWorkout,
  getRecentPRCount,
  getStrongestLiftLabel,
} from "@/features/fitness/selectors";
import { REST_LABELS } from "@/features/fitness/constants";
import { loadScheduleTemplates } from "@/features/schedule/scheduleStorage";
import { getTodoWeeklySummary, type Todo } from "@/features/todos/todoStorage";
import {
  markAIUsageLimitReached,
  writeAIUsageCache,
} from "@/features/subscription/aiUsageCache";
import { useTier, type Tier } from "@/features/subscription/useTier";
import { capture } from "@/lib/analytics";

const SUPABASE_FN =
  "https://jvtpemjrswfwsiwkhreq.supabase.co/functions/v1/hyper-responder";

const WEEKLY_REPORT_CACHE_KEY = "cache:weekly-report:latest:v1";

type Completeness = "complete" | "partial" | "unknown";

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

type Status = "idle" | "loading" | "generating" | "error";

type WeeklyDataPayload = {
  weekStart: string;
  weekEnd: string;
  modules: string[];
  profile: {
    displayName: string | null;
    activityLevel: string | null;
    dailyReadingGoal: number | null;
    measurementSystem?: string | null;
    dateFormat?: string | null;
    timeFormat?: string | null;
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

type GoalSummaryModel = Pick<UserGoal, "id" | "title" | "priority" | "steps">;

type NutritionLogRow = {
  log_date: string;
  eaten: NutritionLog["eaten"];
  custom_entries: NutritionLog["customEntries"];
};

type TodoRow = Todo;

type ScheduleLogRow = {
  log_date: string;
  view: "office" | "weekend" | "wfh" | null;
  completed: unknown[];
};

type WeeklyReportDbRow = {
  id: string;
  week_start: string;
  report: WeeklyReport;
  created_at: string;
};

type WeeklyReportFnResponse = {
  report: WeeklyReport;
  usage?: {
    prompts_used: number;
    monthly_limit: number;
    remaining: number;
    tier?: Tier;
  };
};

type WeeklyReportLimitPayload = {
  message?: string;
  tier?: Tier;
  monthly_limit?: number;
  prompts_used?: number;
};

type SplitDayCacheEntry = {
  label?: string;
  completedDate?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toGoalStep(value: unknown): UserGoalStep | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;

  return {
    id: value.id,
    label: typeof value.label === "string" ? value.label : "",
    notes: typeof value.notes === "string" ? value.notes : "",
    idealFinish: typeof value.idealFinish === "string" ? value.idealFinish : null,
    estimatedTime:
      typeof value.estimatedTime === "string" ? value.estimatedTime : "",
    sortOrder: typeof value.sortOrder === "number" ? value.sortOrder : 0,
  };
}

function toGoalSummaryModel(goal: unknown): GoalSummaryModel | null {
  if (!isRecord(goal) || typeof goal.id !== "string") return null;

  const stepsRaw = Array.isArray(goal.steps) ? goal.steps : [];
  const steps = stepsRaw
    .map((step) => toGoalStep(step))
    .filter((step): step is UserGoalStep => step !== null);

  return {
    id: goal.id,
    title: typeof goal.title === "string" ? goal.title : "Untitled goal",
    priority:
      goal.priority === "high" || goal.priority === "low" ? goal.priority : "medium",
    steps,
  };
}

function toSplitDayCacheEntry(value: unknown): SplitDayCacheEntry | null {
  if (!isRecord(value)) return null;

  return {
    label: typeof value.label === "string" ? value.label : undefined,
    completedDate:
      typeof value.completedDate === "string" ? value.completedDate : undefined,
  };
}

function toNutritionLogRow(row: unknown): NutritionLogRow | null {
  if (!isRecord(row) || typeof row.log_date !== "string") return null;

  return {
    log_date: row.log_date,
    eaten: isRecord(row.eaten) ? (row.eaten as NutritionLog["eaten"]) : {},
    custom_entries: Array.isArray(row.custom_entries)
      ? (row.custom_entries as NutritionLog["customEntries"])
      : [],
  };
}

function toTodoRow(row: unknown): TodoRow | null {
  if (!isRecord(row)) return null;
  if (
    typeof row.id !== "string" ||
    typeof row.text !== "string" ||
    typeof row.done !== "boolean" ||
    typeof row.created_at !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    text: row.text,
    done: row.done,
    created_at: row.created_at,
  };
}

function toScheduleLogRow(row: unknown): ScheduleLogRow | null {
  if (!isRecord(row) || typeof row.log_date !== "string") return null;

  const view =
    row.view === "office" || row.view === "weekend" || row.view === "wfh"
      ? row.view
      : null;

  return {
    log_date: row.log_date,
    view,
    completed: Array.isArray(row.completed) ? row.completed : [],
  };
}

function toWeeklyReportDbRow(row: unknown): WeeklyReportDbRow | null {
  if (!isRecord(row)) return null;
  if (
    typeof row.id !== "string" ||
    typeof row.week_start !== "string" ||
    typeof row.created_at !== "string" ||
    !isRecord(row.report)
  ) {
    return null;
  }

  return {
    id: row.id,
    week_start: row.week_start,
    report: row.report as WeeklyReport,
    created_at: row.created_at,
  };
}

function toWeeklyReportFnResponse(value: unknown): WeeklyReportFnResponse | null {
  if (!isRecord(value) || !isRecord(value.report)) return null;

  let usage:
    | {
        prompts_used: number;
        monthly_limit: number;
        remaining: number;
        tier?: Tier;
      }
    | undefined;

  if (
    isRecord(value.usage) &&
    typeof value.usage.prompts_used === "number" &&
    typeof value.usage.monthly_limit === "number" &&
    typeof value.usage.remaining === "number"
  ) {
    const usageTier: Tier | undefined =
      value.usage.tier === "free" ||
      value.usage.tier === "pro" ||
      value.usage.tier === "pro_max"
        ? value.usage.tier
        : undefined;

    usage = {
      prompts_used: value.usage.prompts_used,
      monthly_limit: value.usage.monthly_limit,
      remaining: value.usage.remaining,
      tier: usageTier,
    };
  }

  return {
    report: value.report as WeeklyReport,
    usage,
  };
}

function readLatestReportCache(): WeeklyReportRecord | null {
  const userId = getActiveUserId();
  if (!userId) return null;

  try {
    const raw = getScopedStorageItem(WEEKLY_REPORT_CACHE_KEY, userId);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as WeeklyReportRecord | null;
    if (!parsed?.id || !parsed?.weekStart || !parsed?.report) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLatestReportCache(report: WeeklyReportRecord | null) {
  const userId = getActiveUserId();
  if (!userId) return;

  try {
    if (!report) {
      removeScopedStorageItem(WEEKLY_REPORT_CACHE_KEY, userId);
      return;
    }

    writeScopedStorageItem(WEEKLY_REPORT_CACHE_KEY, userId, JSON.stringify(report));
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
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
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

function summarizeGoals(goals: GoalSummaryModel[]) {
  const userId = getActiveUserId();
  const doneMap = userId
    ? readJson<Record<string, Record<string, boolean>>>(
        scopedKey("goals:done:v1", userId),
      ) ?? {}
    : {};
  const history: Array<{ date?: string }> = userId
    ? (readJson<Array<{ date?: string }>>(
        scopedKey("goals:step-history:v1", userId),
      ) ?? [])
    : [];

  const today = getLocalDateKey();
  const weekStart = getCurrentWeekStart();

  const topGoals = goals.slice(0, 5).map((goal) => {
    const steps = Array.isArray(goal.steps) ? goal.steps : [];
    const done = doneMap[String(goal.id)] ?? {};
    const doneCount = steps.filter((step) => done[String(step.id)]).length;
    const pct = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

    return {
      title: String(goal.title ?? "Untitled goal"),
      priority: String(goal.priority ?? "medium"),
      pct,
    };
  });

  const overdueSteps = goals.reduce((count, goal) => {
    const steps = Array.isArray(goal.steps) ? goal.steps : [];
    const done = doneMap[String(goal.id)] ?? {};

    return (
      count +
      steps.filter((step) => {
        const idealFinish =
          typeof step?.idealFinish === "string" ? step.idealFinish : null;
        if (!idealFinish) return false;
        if (done[String(step.id)]) return false;
        return idealFinish < today;
      }).length
    );
  }, 0);

  const stepsCompletedThisWeek = history.filter(
    (entry: { date?: string }) => {
      const date = typeof entry?.date === "string" ? entry.date : "";
      return date >= weekStart && date <= today;
    },
  ).length;

  return {
    total: goals.length,
    stepsCompletedThisWeek,
    overdueSteps,
    topGoals,
    dataCompleteness: "complete" as Completeness,
  };
}

function tryReadWeeklySplitSummary(
  weekStart: string,
  weekEnd: string,
): {
  workoutsThisWeek: number;
  daysSinceLastWorkout: number | null;
} | null {
  const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !/fitness|split/i.test(key)) continue;

    const parsed = readJson<unknown>(key);
    if (!isRecord(parsed) || !isRecord(parsed.days)) continue;

    const days = parsed.days;
    if (!dayKeys.every((day) => isRecord(days[day]))) continue;

    let workoutsThisWeek = 0;
    let lastCompletedDate: string | null = null;

    for (const dayKey of dayKeys) {
      const item = toSplitDayCacheEntry(days[dayKey]);
      const label = item?.label?.trim().toLowerCase() ?? "";
      const completedDate = item?.completedDate ?? null;

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
  if (!modules.has("fitness")) return undefined;

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
      ? ("complete" as Completeness)
      : prGoals.length > 0
        ? ("partial" as Completeness)
        : ("unknown" as Completeness),
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
  if (!modules.has("nutrition")) return undefined;

  const phase = await loadPhase();
  const profile = await loadProfile();
  const targets = getTargets(phase, profile);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      avgCaloriesLogged: 0,
      calorieTarget: targets.cal,
      avgProteinLogged: 0,
      proteinTarget: targets.protein,
      daysLogged: 0,
      dataCompleteness: "unknown" as Completeness,
    };
  }

  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("log_date, eaten, custom_entries")
    .eq("user_id", user.id)
    .gte("log_date", weekStart)
    .lte("log_date", weekEnd)
    .order("log_date", { ascending: true });

  if (error) {
    console.warn("collectNutritionData error:", error);
    return {
      avgCaloriesLogged: 0,
      calorieTarget: targets.cal,
      avgProteinLogged: 0,
      proteinTarget: targets.protein,
      daysLogged: 0,
      dataCompleteness: "unknown" as Completeness,
    };
  }

  const logs: NutritionLog[] = (data ?? [])
    .map((row) => toNutritionLogRow(row))
    .filter((row): row is NutritionLogRow => row !== null)
    .map((row) => ({
      date: row.log_date,
      eaten: row.eaten,
      customEntries: row.custom_entries,
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
        ? ("complete" as Completeness)
        : daysLogged > 0
          ? ("partial" as Completeness)
          : ("unknown" as Completeness),
  };
}

async function collectReadingData(
  modules: Set<string>,
  weekStart: string,
  weekEnd: string,
) {
  if (!modules.has("reading")) return undefined;

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
  if (!modules.has("todos")) return undefined;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      completedThisWeek: null,
      totalCreatedThisWeek: 0,
      completedTotal: 0,
      openCount: 0,
      dataCompleteness: "unknown" as Completeness,
    };
  }

  const { data, error } = await supabase
    .from("todos")
    .select("id, text, done, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("collectTodosData error:", error);
    return {
      completedThisWeek: null,
      totalCreatedThisWeek: 0,
      completedTotal: 0,
      openCount: 0,
      dataCompleteness: "unknown" as Completeness,
    };
  }

  const todos = (data ?? [])
    .map((row) => toTodoRow(row))
    .filter((row): row is TodoRow => row !== null);
  return getTodoWeeklySummary(weekStart, weekEnd, todos);
}

async function collectScheduleData(
  modules: Set<string>,
  weekStart: string,
  weekEnd: string,
) {
  if (!modules.has("schedule")) return undefined;

  const templates = await loadScheduleTemplates();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      blocksCompletedThisWeek: 0,
      totalBlocksThisWeek: 0,
      activeDays: 0,
      dataCompleteness: "unknown" as Completeness,
    };
  }

  const { data, error } = await supabase
    .from("schedule_logs")
    .select("log_date, view, completed")
    .eq("user_id", user.id)
    .gte("log_date", weekStart)
    .lte("log_date", weekEnd)
    .order("log_date", { ascending: true });

  if (error) {
    console.warn("collectScheduleData error:", error);
    return {
      blocksCompletedThisWeek: 0,
      totalBlocksThisWeek: 0,
      activeDays: 0,
      dataCompleteness: "unknown" as Completeness,
    };
  }

  let blocksCompletedThisWeek = 0;
  let totalBlocksThisWeek = 0;

  const scheduleRows = (data ?? [])
    .map((row) => toScheduleLogRow(row))
    .filter((row): row is ScheduleLogRow => row !== null);

  for (const row of scheduleRows) {
    const rawView = row.view;
    const view: keyof typeof templates =
      rawView === "office" || rawView === "weekend" || rawView === "wfh"
        ? rawView
        : "wfh";

    const blocks = templates[view]?.length ?? 0;
    const completed = row.completed.length;

    totalBlocksThisWeek += blocks;
    blocksCompletedThisWeek += completed;
  }

  const activeDays = scheduleRows.length;

  return {
    blocksCompletedThisWeek,
    totalBlocksThisWeek,
    activeDays,
    dataCompleteness:
      activeDays >= 5
        ? ("complete" as Completeness)
        : activeDays > 0
          ? ("partial" as Completeness)
          : ("unknown" as Completeness),
  };
}

export function useWeeklyReport(modules: Set<string>) {
  const tier = useTier();

  const [limitHit, setLimitHit] = useState(false);
  const [report, setReport] = useState<WeeklyReportRecord | null>(() =>
    readLatestReportCache(),
  );
  const [status, setStatus] = useState<Status>(() =>
    readLatestReportCache() ? "idle" : "loading",
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
        setStatus("loading");
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) setStatus("idle");
          return;
        }

        const { data, error: dbErr } = await supabase
          .from("ai_weekly_reports")
          .select("id, week_start, report, created_at")
          .eq("user_id", user.id)
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (dbErr || !data) {
          setStatus("idle");
          return;
        }

        const row = toWeeklyReportDbRow(data);
        if (!row) {
          setStatus("idle");
          return;
        }

        const latest: WeeklyReportRecord = {
          id: row.id,
          weekStart: row.week_start,
          report: row.report,
          createdAt: row.created_at,
        };

        setReport(latest);
        writeLatestReportCache(latest);
        setStatus("idle");
      } catch {
        if (!cancelled) setStatus("idle");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const generate = useCallback(async () => {
    setStatus("generating");
    setError(null);
    setLimitHit(false);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not signed in");
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

      const profile = await loadProfile();

      let userContext = "";
      try {
        userContext = await getAISystemContext();
      } catch {
        // non-fatal
      }

      const enabledModules: Set<string> = modules;

      const weeklyData: WeeklyDataPayload = {
        weekStart,
        weekEnd,
        modules: Array.from(enabledModules),
        profile: {
          displayName: profile?.display_name ?? null,
          activityLevel: profile?.activity_level ?? null,
          dailyReadingGoal: profile?.daily_reading_goal ?? null,
          measurementSystem: profile?.measurement_system ?? null,
          dateFormat: profile?.date_format ?? null,
          timeFormat: profile?.time_format ?? null,
        },
        goals: summarizeGoals(
          goals
            .map((goal) => toGoalSummaryModel(goal))
            .filter((goal): goal is GoalSummaryModel => goal !== null),
        ),
        fitness,
        nutrition,
        reading,
        todos,
        schedule,
      };

      const res = await fetch(SUPABASE_FN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "weekly-report",
          userContext,
          weeklyData,
        }),
      });

      if (res.status === 403) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Upgrade to Pro to generate weekly reports.");
      }

      if (res.status === 429) {
        const d = (await res.json().catch(() => ({}))) as WeeklyReportLimitPayload;
        markAIUsageLimitReached(
          {
            tier: d.tier ?? tier,
            monthly_limit: d.monthly_limit,
            prompts_used: d.prompts_used,
          },
          tier,
        );
        setLimitHit(true);
        setError(d.message ?? "Monthly AI limit reached.");
        setStatus("idle");
        return;
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to generate report");
      }

      const dataRaw: unknown = await res.json();
      const data = toWeeklyReportFnResponse(dataRaw);
      if (!data) {
        throw new Error("Failed to parse report response");
      }

      const newRecord: WeeklyReportRecord = {
        id: crypto.randomUUID(),
        weekStart,
        report: data.report,
        createdAt: new Date().toISOString(),
      };

      setReport(newRecord);
      writeLatestReportCache(newRecord);

      if (data.usage) {
        setUsage(data.usage);
        writeAIUsageCache(
          {
            ...data.usage,
            tier: data.usage.tier ?? tier,
          },
          tier,
        );
        capture("ai_prompt_used", {
          feature: "weekly_report",
          source: "weekly_report",
          route: window.location.pathname,
          prompts_used: data.usage.prompts_used,
          monthly_limit: data.usage.monthly_limit,
          remaining: data.usage.remaining,
          tier: data.usage.tier ?? tier,
        });
      }

      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  }, [modules, tier, weekEnd, weekStart]);

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
