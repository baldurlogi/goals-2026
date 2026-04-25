import { useCallback, useEffect, useState } from "react";
import { getSupabaseFunctionUrl, supabase } from "@/lib/supabaseClient";
import { getAISystemContext } from "@/features/ai/buildAIContext";
import { loadUserGoals } from "@/features/goals/userGoalStorage";
import type { UserGoal, UserGoalStep } from "@/features/goals/goalTypes";
import type { StepHistoryEntry } from "@/features/goals/goalStore";
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
import { getDisplayedReadingStreak } from "@/features/reading/readingUtils";
import { loadPRGoals } from "@/features/fitness/prGoalStorage";
import {
  getDaysSinceWorkout,
  getRecentPRCount,
  getStrongestLiftLabel,
} from "@/features/fitness/selectors";
import { REST_LABELS } from "@/features/fitness/constants";
import {
  getScheduleDayKeyForDate,
  loadScheduleTemplates,
} from "@/features/schedule/scheduleStorage";
import { getTodoWeeklySummary, type Todo } from "@/features/todos/todoStorage";
import {
  markAIUsageLimitReached,
  writeAIUsageCache,
} from "@/features/subscription/aiUsageCache";
import {
  AI_ACTION_CREDIT_COSTS,
  coerceAIUsage,
  type AILimitPayload,
  type AIUsage,
} from "@/features/subscription/aiCredits";
import { useTier } from "@/features/subscription/useTier";
import { capture } from "@/lib/analytics";
import { loadSleepRecoveryEntriesInRange } from "@/features/sleep/sleepStorage";
import { loadMentalWellbeingEntriesInRange } from "@/features/wellbeing/wellbeingStorage";

const SUPABASE_FN = getSupabaseFunctionUrl("hyper-responder");

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
  sleep?: {
    avgSleepDurationMinutes: number | null;
    avgSleepQualityScore: number | null;
    bedtimeConsistencyMinutes: number | null;
    loggedDays: number;
    lastSleepDurationMinutes: number | null;
    lastSleepQualityScore: number | null;
    dataCompleteness: Completeness;
  };
  wellbeing?: {
    avgMoodScore: number | null;
    avgStressLevel: number | null;
    recentMoodTrend: "up" | "down" | "steady" | "unknown";
    recentStressTrend: "up" | "down" | "steady" | "unknown";
    checkInDays: number;
    journalDays: number;
    gratitudeDays: number;
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
  completed: unknown[];
  total_blocks: number | null;
};

type WeeklyReportDbRow = {
  id: string;
  week_start: string;
  report: WeeklyReport;
  created_at: string;
};

type WeeklyReportFnResponse = {
  report: WeeklyReport;
  usage?: AIUsage;
};

type WeeklyReportLimitPayload = AILimitPayload;

const REPORT_MODULE_META = {
  goals: { label: "Goals", emoji: "🎯" },
  fitness: { label: "Fitness", emoji: "💪" },
  nutrition: { label: "Nutrition", emoji: "🥗" },
  reading: { label: "Reading", emoji: "📖" },
  todos: { label: "Todos", emoji: "✅" },
  schedule: { label: "Schedule", emoji: "📅" },
  sleep: { label: "Sleep", emoji: "😴" },
  wellbeing: { label: "Wellbeing", emoji: "💚" },
} as const;

type ReportModuleKey = keyof typeof REPORT_MODULE_META;

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
    links: Array.isArray(value.links)
      ? value.links.filter((item): item is string => typeof item === "string")
      : undefined,
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

  return {
    log_date: row.log_date,
    completed: Array.isArray(row.completed) ? row.completed : [],
    total_blocks:
      typeof row.total_blocks === "number" && Number.isFinite(row.total_blocks)
        ? row.total_blocks
        : null,
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

  const usage = isRecord(value.usage)
    ? coerceAIUsage(value.usage, {
        credits_used: AI_ACTION_CREDIT_COSTS.weeklyReport,
        monthly_limit: 1000,
        remaining: 1000 - AI_ACTION_CREDIT_COSTS.weeklyReport,
        tier: "free",
        credits_cost: AI_ACTION_CREDIT_COSTS.weeklyReport,
      })
    : undefined;

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

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageOrNull(values: number[]) {
  if (values.length === 0) return null;
  return Number(average(values).toFixed(1));
}

function toNormalizedBedtimeMinutes(value: string | null) {
  if (!value) return null;

  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  const total = hours * 60 + minutes;
  return hours < 12 ? total + 24 * 60 : total;
}

function computeBedtimeConsistencyMinutes(
  values: Array<string | null>,
): number | null {
  const minutes = values
    .map((value) => toNormalizedBedtimeMinutes(value))
    .filter((value): value is number => value !== null);

  if (minutes.length < 2) return null;
  return Math.max(...minutes) - Math.min(...minutes);
}

function computeTrend(values: number[]): "up" | "down" | "steady" | "unknown" {
  if (values.length < 2) return "unknown";

  const delta = values[values.length - 1] - values[0];
  if (Math.abs(delta) < 0.5) return "steady";
  return delta > 0 ? "up" : "down";
}

function asReportModuleKey(value: string): ReportModuleKey | null {
  return value in REPORT_MODULE_META ? (value as ReportModuleKey) : null;
}

function fallbackModuleOneliner(
  module: ReportModuleKey,
  payload: WeeklyDataPayload,
) {
  switch (module) {
    case "goals": {
      const goals = payload.goals;
      if (!goals || goals.total === 0) return "No goals set yet.";
      if (goals.overdueSteps > 0) {
        return `${goals.overdueSteps} overdue step${goals.overdueSteps === 1 ? "" : "s"} still need attention.`;
      }
      return `${goals.stepsCompletedThisWeek} step${goals.stepsCompletedThisWeek === 1 ? "" : "s"} completed this week.`;
    }
    case "fitness": {
      const fitness = payload.fitness;
      if (!fitness) return "No fitness data this week.";
      if ((fitness.workoutsThisWeek ?? 0) > 0) {
        return `${fitness.workoutsThisWeek} workout${fitness.workoutsThisWeek === 1 ? "" : "s"} logged this week.`;
      }
      return "No workouts logged this week.";
    }
    case "nutrition": {
      const nutrition = payload.nutrition;
      if (!nutrition) return "No nutrition data this week.";
      return `${nutrition.daysLogged} day${nutrition.daysLogged === 1 ? "" : "s"} of nutrition logged.`;
    }
    case "reading": {
      const reading = payload.reading;
      if (!reading?.currentBook) return "No current book set.";
      if ((reading.pagesRead ?? 0) > 0) {
        return `${reading.pagesRead} page${reading.pagesRead === 1 ? "" : "s"} read this week.`;
      }
      return `${reading.daysRead} day${reading.daysRead === 1 ? "" : "s"} with reading activity.`;
    }
    case "todos": {
      const todos = payload.todos;
      if (!todos) return "No todo data this week.";
      return `${todos.completedThisWeek ?? 0} todo${todos.completedThisWeek === 1 ? "" : "s"} completed this week.`;
    }
    case "schedule": {
      const schedule = payload.schedule;
      if (!schedule) return "No schedule data this week.";
      return `${schedule.blocksCompletedThisWeek} block${schedule.blocksCompletedThisWeek === 1 ? "" : "s"} completed this week.`;
    }
    case "sleep": {
      const sleep = payload.sleep;
      if (!sleep) return "No sleep data this week.";
      if (sleep.avgSleepDurationMinutes !== null) {
        return `${sleep.loggedDays} night${sleep.loggedDays === 1 ? "" : "s"} logged with ${Math.round(sleep.avgSleepDurationMinutes)} min average sleep.`;
      }
      return `${sleep.loggedDays} sleep log${sleep.loggedDays === 1 ? "" : "s"} recorded this week.`;
    }
    case "wellbeing": {
      const wellbeing = payload.wellbeing;
      if (!wellbeing) return "No wellbeing check-ins this week.";
      return `${wellbeing.checkInDays} wellbeing check-in${wellbeing.checkInDays === 1 ? "" : "s"} logged this week.`;
    }
  }
}

function scoreGoals(goals?: WeeklyDataPayload["goals"]) {
  if (!goals) return 0;
  if (goals.total === 0) return 18;

  const avgProgress = average(goals.topGoals.map((goal) => goal.pct));
  const completionBoost = Math.min(goals.stepsCompletedThisWeek * 7, 28);
  const overduePenalty = Math.min(goals.overdueSteps * 8, 36);
  const activeGoalBoost = Math.min(goals.total * 4, 12);

  return clampScore(avgProgress * 0.65 + completionBoost + activeGoalBoost - overduePenalty);
}

function scoreFitness(fitness?: WeeklyDataPayload["fitness"]) {
  if (!fitness) return 0;

  const workouts = Math.max(fitness.workoutsThisWeek ?? 0, 0);
  const workoutScore = Math.min((workouts / 4) * 70, 70);
  const recencyScore =
    typeof fitness.daysSinceLastWorkout === "number"
      ? Math.max(0, 20 - Math.min(fitness.daysSinceLastWorkout, 10) * 2)
      : fitness.dataCompleteness === "unknown"
        ? 12
        : 0;
  const prBoost = Math.min((fitness.prsThisWeek ?? 0) * 5, 10);

  return clampScore(workoutScore + recencyScore + prBoost);
}

function scoreNutrition(nutrition?: WeeklyDataPayload["nutrition"]) {
  if (!nutrition) return 0;

  const dayScore = Math.min((nutrition.daysLogged / 7) * 55, 55);
  const calorieScore =
    nutrition.calorieTarget && nutrition.avgCaloriesLogged > 0
      ? Math.max(
          0,
          25 - Math.min(
            Math.abs(nutrition.avgCaloriesLogged - nutrition.calorieTarget) /
              nutrition.calorieTarget,
            1,
          ) * 35,
        )
      : nutrition.dataCompleteness === "unknown"
        ? 12
        : 0;
  const proteinScore =
    nutrition.proteinTarget && nutrition.avgProteinLogged > 0
      ? Math.max(
          0,
          20 - Math.min(
            Math.abs(nutrition.avgProteinLogged - nutrition.proteinTarget) /
              nutrition.proteinTarget,
            1,
          ) * 28,
        )
      : nutrition.dataCompleteness === "unknown"
        ? 10
        : 0;

  return clampScore(dayScore + calorieScore + proteinScore);
}

function scoreReading(reading?: WeeklyDataPayload["reading"]) {
  if (!reading) return 0;
  if (!reading.currentBook) return 15;

  const weeklyGoalPages = Math.max(reading.dailyGoalPages * 7, 1);
  const pageScore =
    typeof reading.pagesRead === "number"
      ? Math.min(reading.pagesRead / weeklyGoalPages, 1.2) * 65
      : 0;
  const daysScore = Math.min((reading.daysRead / 7) * 25, 25);
  const streakScore = Math.min((reading.streak / 7) * 10, 10);
  const partialSignalBoost =
    reading.pagesRead === null && reading.daysRead > 0 ? 12 : 0;

  return clampScore(pageScore + daysScore + streakScore + partialSignalBoost);
}

function scoreTodos(todos?: WeeklyDataPayload["todos"]) {
  if (!todos) return 0;

  const created = Math.max(todos.totalCreatedThisWeek, 0);
  const completedThisWeek = Math.max(todos.completedThisWeek ?? 0, 0);
  const completionRatio =
    created > 0 ? Math.min(completedThisWeek / created, 1.2) : completedThisWeek > 0 ? 1 : 0;
  const completionScore = completionRatio * 70;
  const openPenalty = Math.min(Math.max(todos.openCount, 0), 20);

  return clampScore(completionScore + 20 - openPenalty);
}

function scoreSchedule(schedule?: WeeklyDataPayload["schedule"]) {
  if (!schedule) return 0;

  const blockRatio =
    schedule.totalBlocksThisWeek > 0
      ? Math.min(schedule.blocksCompletedThisWeek / schedule.totalBlocksThisWeek, 1.1)
      : 0;
  const blockScore = blockRatio * 75;
  const dayScore = Math.min((schedule.activeDays / 7) * 25, 25);

  return clampScore(blockScore + dayScore);
}

function scoreSleep(sleep?: WeeklyDataPayload["sleep"]) {
  if (!sleep) return 0;

  const loggingScore = Math.min((sleep.loggedDays / 7) * 45, 45);
  const durationScore =
    typeof sleep.avgSleepDurationMinutes === "number"
      ? Math.max(
          0,
          25 -
            Math.min(
              Math.abs(sleep.avgSleepDurationMinutes - 480) / 240,
              1,
            ) *
              25,
        )
      : sleep.dataCompleteness === "unknown"
        ? 8
        : 0;
  const qualityScore =
    typeof sleep.avgSleepQualityScore === "number"
      ? Math.min((sleep.avgSleepQualityScore / 100) * 20, 20)
      : 0;
  const consistencyScore =
    typeof sleep.bedtimeConsistencyMinutes === "number"
      ? Math.max(0, 10 - Math.min(sleep.bedtimeConsistencyMinutes / 120, 1) * 10)
      : 0;

  return clampScore(loggingScore + durationScore + qualityScore + consistencyScore);
}

function scoreWellbeing(wellbeing?: WeeklyDataPayload["wellbeing"]) {
  if (!wellbeing) return 0;

  const checkInScore = Math.min((wellbeing.checkInDays / 7) * 60, 60);
  const journalScore = Math.min((wellbeing.journalDays / 5) * 20, 20);
  const moodSignal =
    typeof wellbeing.avgMoodScore === "number"
      ? Math.min((wellbeing.avgMoodScore / 5) * 10, 10)
      : 0;
  const stressSignal =
    typeof wellbeing.avgStressLevel === "number"
      ? Math.max(0, ((6 - wellbeing.avgStressLevel) / 5) * 10)
      : 0;

  return clampScore(checkInScore + journalScore + moodSignal + stressSignal);
}

function scoreModule(
  module: ReportModuleKey,
  payload: WeeklyDataPayload,
) {
  switch (module) {
    case "goals":
      return scoreGoals(payload.goals);
    case "fitness":
      return scoreFitness(payload.fitness);
    case "nutrition":
      return scoreNutrition(payload.nutrition);
    case "reading":
      return scoreReading(payload.reading);
    case "todos":
      return scoreTodos(payload.todos);
    case "schedule":
      return scoreSchedule(payload.schedule);
    case "sleep":
      return scoreSleep(payload.sleep);
    case "wellbeing":
      return scoreWellbeing(payload.wellbeing);
  }
}

function computeModuleScores(payload: WeeklyDataPayload): ModuleScore[] {
  return payload.modules
    .map((moduleName) => asReportModuleKey(moduleName))
    .filter((module): module is ReportModuleKey => module !== null)
    .map((module) => ({
      module,
      label: REPORT_MODULE_META[module].label,
      emoji: REPORT_MODULE_META[module].emoji,
      score: scoreModule(module, payload),
      oneliner: fallbackModuleOneliner(module, payload),
    }));
}

function normalizeWeeklyReportScores(
  report: WeeklyReport,
  payload: WeeklyDataPayload,
): WeeklyReport {
  const aiScores = new Map(report.moduleScores.map((item) => [item.module, item]));
  const moduleScores = computeModuleScores(payload).map((item) => {
    const ai = aiScores.get(item.module);
    return {
      ...item,
      oneliner: ai?.oneliner?.trim() || item.oneliner,
    };
  });

  return {
    ...report,
    moduleScores,
    overallScore: clampScore(average(moduleScores.map((item) => item.score))),
  };
}

function summarizeGoals(goals: GoalSummaryModel[]) {
  const userId = getActiveUserId();
  const doneMap = userId
    ? readJson<Record<string, Record<string, boolean>>>(
        scopedKey("goals:done:v1", userId),
      ) ?? {}
    : {};
  const history: StepHistoryEntry[] = userId
    ? (readJson<StepHistoryEntry[]>(
        scopedKey("goals:step-history:v1", userId),
      ) ?? [])
    : [];

  const today = getLocalDateKey();
  const weekStart = getCurrentWeekStart();

  const goalProgress = goals.map((goal) => {
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

  const priorityRank: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const topGoals = [...goalProgress]
    .sort(
      (a, b) =>
        (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0) ||
        b.pct - a.pct ||
        a.title.localeCompare(b.title),
    )
    .slice(0, 5);

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

  const stepsCompletedThisWeek = new Set(
    history
      .filter((entry) => entry.date >= weekStart && entry.date <= today)
      .map((entry) => `${entry.goalId}:${entry.stepId}`),
  ).size;

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
  const displayedStreak = getDisplayedReadingStreak(
    inputs.streak ?? 0,
    inputs.lastReadDate,
    getLocalDateKey(),
  );

  const hasOnlyThinSignal =
    summary.daysRead <= 1 && displayedStreak > 1 && summary.pagesRead === 0;

  return {
    currentBook: inputs.current.title.trim() || null,
    streak: displayedStreak,
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

  const baseQuery = supabase
    .from("schedule_logs")
    .select("log_date, completed, total_blocks")
    .eq("user_id", user.id)
    .gte("log_date", weekStart)
    .lte("log_date", weekEnd)
    .order("log_date", { ascending: true });

  let { data, error } = await baseQuery;

  if (error) {
    const missingTotalBlocks =
      error.code === "PGRST204" ||
      error.message.toLowerCase().includes("total_blocks");

    if (missingTotalBlocks) {
      const fallback = await supabase
        .from("schedule_logs")
        .select("log_date, completed")
        .eq("user_id", user.id)
        .gte("log_date", weekStart)
        .lte("log_date", weekEnd)
        .order("log_date", { ascending: true });

      data =
        fallback.data?.map((row) => ({
          ...row,
          total_blocks: null,
        })) ?? null;
      error = fallback.error;
    }
  }

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
    const dayKey = getScheduleDayKeyForDate(row.log_date);
    const blocks = row.total_blocks ?? templates[dayKey]?.length ?? 0;
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

async function collectSleepData(
  modules: Set<string>,
  weekStart: string,
  weekEnd: string,
) {
  if (!modules.has("sleep")) return undefined;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      avgSleepDurationMinutes: null,
      avgSleepQualityScore: null,
      bedtimeConsistencyMinutes: null,
      loggedDays: 0,
      lastSleepDurationMinutes: null,
      lastSleepQualityScore: null,
      dataCompleteness: "unknown" as Completeness,
    };
  }

  try {
    const entries = await loadSleepRecoveryEntriesInRange(
      user.id,
      weekStart,
      weekEnd,
    );
    const durationValues = entries
      .map((entry) => entry.sleepDurationMinutes)
      .filter((value): value is number => value !== null);
    const qualityValues = entries
      .map((entry) => entry.sleepQualityScore)
      .filter((value): value is number => value !== null);
    const latest = entries[entries.length - 1] ?? null;

    return {
      avgSleepDurationMinutes: averageOrNull(durationValues),
      avgSleepQualityScore: averageOrNull(qualityValues),
      bedtimeConsistencyMinutes: computeBedtimeConsistencyMinutes(
        entries.map((entry) => entry.bedtime),
      ),
      loggedDays: entries.length,
      lastSleepDurationMinutes: latest?.sleepDurationMinutes ?? null,
      lastSleepQualityScore: latest?.sleepQualityScore ?? null,
      dataCompleteness:
        entries.length >= 5
          ? ("complete" as Completeness)
          : entries.length > 0
            ? ("partial" as Completeness)
            : ("unknown" as Completeness),
    };
  } catch (error) {
    console.warn("collectSleepData error:", error);
    return {
      avgSleepDurationMinutes: null,
      avgSleepQualityScore: null,
      bedtimeConsistencyMinutes: null,
      loggedDays: 0,
      lastSleepDurationMinutes: null,
      lastSleepQualityScore: null,
      dataCompleteness: "unknown" as Completeness,
    };
  }
}

async function collectWellbeingData(
  modules: Set<string>,
  weekStart: string,
  weekEnd: string,
) {
  if (!modules.has("wellbeing")) return undefined;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      avgMoodScore: null,
      avgStressLevel: null,
      recentMoodTrend: "unknown" as const,
      recentStressTrend: "unknown" as const,
      checkInDays: 0,
      journalDays: 0,
      gratitudeDays: 0,
      dataCompleteness: "unknown" as Completeness,
    };
  }

  try {
    const entries = await loadMentalWellbeingEntriesInRange(
      user.id,
      weekStart,
      weekEnd,
    );
    const moodValues = entries
      .flatMap((entry) => (entry.moodScore === null ? [] : [entry.moodScore]));
    const stressValues = entries
      .flatMap((entry) =>
        entry.stressLevel === null ? [] : [entry.stressLevel],
      );

    return {
      avgMoodScore: averageOrNull(moodValues),
      avgStressLevel: averageOrNull(stressValues),
      recentMoodTrend: computeTrend(moodValues),
      recentStressTrend: computeTrend(stressValues),
      checkInDays: entries.length,
      journalDays: entries.filter(
        (entry) => (entry.journalEntry?.trim() ?? "") !== "",
      ).length,
      gratitudeDays: entries.filter(
        (entry) => (entry.gratitudeEntry?.trim() ?? "") !== "",
      ).length,
      dataCompleteness:
        entries.length >= 5
          ? ("complete" as Completeness)
          : entries.length > 0
            ? ("partial" as Completeness)
            : ("unknown" as Completeness),
    };
  } catch (error) {
    console.warn("collectWellbeingData error:", error);
    return {
      avgMoodScore: null,
      avgStressLevel: null,
      recentMoodTrend: "unknown" as const,
      recentStressTrend: "unknown" as const,
      checkInDays: 0,
      journalDays: 0,
      gratitudeDays: 0,
      dataCompleteness: "unknown" as Completeness,
    };
  }
}

async function collectWeeklyDataPayload(
  modules: Set<string>,
  weekStart: string,
  weekEnd: string,
): Promise<WeeklyDataPayload> {
  const [goals, fitness, nutrition, reading, todos, schedule, sleep, wellbeing] =
    await Promise.all([
      loadUserGoals(),
      collectFitnessData(modules, weekStart, weekEnd),
      collectNutritionData(modules, weekStart, weekEnd),
      collectReadingData(modules, weekStart, weekEnd),
      collectTodosData(modules, weekStart, weekEnd),
      collectScheduleData(modules, weekStart, weekEnd),
      collectSleepData(modules, weekStart, weekEnd),
      collectWellbeingData(modules, weekStart, weekEnd),
    ]);

  const profile = await loadProfile();

  return {
    weekStart,
    weekEnd,
    modules: Array.from(modules),
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
    sleep,
    wellbeing,
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
    credits_used: number;
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

        if (row.week_start === weekStart) {
          const weeklyData = await collectWeeklyDataPayload(modules, weekStart, weekEnd);
          latest.report = normalizeWeeklyReportScores(latest.report, weeklyData);
        }

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
  }, [modules, weekEnd, weekStart]);

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

      const weeklyData = await collectWeeklyDataPayload(modules, weekStart, weekEnd);

      let userContext = "";
      try {
        userContext = await getAISystemContext();
      } catch {
        // non-fatal
      }

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
            credits_used: d.credits_used ?? d.prompts_used,
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

      const normalizedReport = normalizeWeeklyReportScores(
        data.report,
        weeklyData,
      );

      const newRecord: WeeklyReportRecord = {
        id: crypto.randomUUID(),
        weekStart,
        report: normalizedReport,
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
        capture("ai_credits_used", {
          feature: "weekly_report",
          source: "weekly_report",
          route: window.location.pathname,
          credits_used: data.usage.credits_used,
          monthly_limit: data.usage.monthly_limit,
          remaining: data.usage.remaining,
          credits_cost:
            data.usage.credits_cost ?? AI_ACTION_CREDIT_COSTS.weeklyReport,
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
