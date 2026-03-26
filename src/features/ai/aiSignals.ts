import {
  loadProfile,
  WEEKDAY_ORDER,
  type WeeklySchedule,
} from "@/features/onboarding/profileStorage";
import { DEFAULT_MODULES, type ModuleId } from "@/features/modules/modules";
import { loadUserGoals } from "@/features/goals/userGoalStorage";
import {
  getDaysSinceWorkout,
  getStrongestLiftLabel,
  getWeakestLiftLabel,
  loadPRGoals,
} from "@/features/fitness/fitnessStorage";
import {
  loadNutritionLog,
  loadPhase,
} from "@/features/nutrition/nutritionStorage";
import { loadWaterLog } from "@/features/water/waterStorage";
import {
  getActiveUserId,
  getScopedStorageItem,
  scopedKey,
} from "@/lib/activeUser";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { getDisplayedReadingStreak } from "@/features/reading/readingUtils";

const CACHE_KEY = "cache:ai-signals:v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

type GoalLike = {
  id?: string;
  title?: string;
  priority?: string;
  steps?: Array<{
    id?: string;
    label?: string;
    idealFinish?: string | null;
  }>;
};

type GoalDoneMap = Record<string, Record<string, boolean>>;

type ReadingState = {
  currentBookTitle: string | null;
  author: string | null;
  currentPage: number | null;
  totalPages: number | null;
  streak: number;
  targetPages: number;
};

type TodoSignal = {
  doneToday: number;
  totalToday: number;
  totalCount: number;
  openCount: number;
};

export type AISignals = {
  builtAt: string;
  modules: ModuleId[];
  profile: {
    displayName: string | null;
    activityLevel: string | null;
    weeklyScheduleSummary: string | null;
    dailyReadingGoal: number | null;
    measurementSystem: string | null;
    dateFormat: string | null;
    timeFormat: string | null;
    tier: "free" | "pro" | "pro_max" | null;
  };
  goals: {
    count: number;
    highestPriorityTitle: string | null;
    highestPriority: string | null;
    overdueSteps: number;
    nextStepLabel: string | null;
    topGoals: Array<{
      id: string;
      title: string;
      priority: string | null;
      overdueCount: number;
      overdueStepLabel: string | null;
      overdueStepDate: string | null;
      nextStepLabel: string | null;
      nextStepDate: string | null;
      stepCount: number;
    }>;
  };
  nutrition: {
    phase: "maintain" | "cut";
    mealsLoggedToday: number;
    calorieTarget: number | null;
    proteinTarget: number | null;
  };
  water: {
    ml: number;
    targetMl: number;
    remainingMl: number;
    goalHit: boolean;
  };
  reading: ReadingState;
  fitness: {
    daysSinceWorkout: number | null;
    strongestLift: string | null;
    weakestLift: string | null;
  };
  todos: TodoSignal | null;
  schedule: {
    completedBlocks: number;
    totalBlocks: number;
  } | null;
};

function cacheKey() {
  return scopedKey(CACHE_KEY, getActiveUserId());
}

function readCache(): AISignals | null {
  try {
    const raw = getScopedStorageItem(CACHE_KEY, getActiveUserId());
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AISignals;
    const age = Date.now() - new Date(parsed.builtAt).getTime();

    return age <= CACHE_TTL_MS ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(signals: AISignals) {
  try {
    localStorage.setItem(cacheKey(), JSON.stringify(signals));
  } catch {
    // ignore
  }
}

function formatWeeklyScheduleSummary(
  schedule: WeeklySchedule | null | undefined,
): string | null {
  if (!schedule) return null;

  return WEEKDAY_ORDER.map(
    (day) => `${day.slice(0, 3)}: ${schedule[day]}`,
  ).join(", ");
}

function normalizeModules(modules: ModuleId[] | null | undefined): ModuleId[] {
  return Array.isArray(modules) && modules.length > 0
    ? modules
    : [...DEFAULT_MODULES];
}

function priorityRank(priority: string | undefined): number {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  if (priority === "low") return 2;
  return 99;
}

function stepUrgencyRank(
  stepDate: string | null | undefined,
  today: string,
): number {
  if (!stepDate) return 3;
  if (stepDate < today) return 0;
  if (stepDate === today) return 1;
  return 2;
}

function todayISO(): string {
  return getLocalDateKey();
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((v) => typeof v === "boolean");
}

function isGoalDoneMap(value: unknown): value is GoalDoneMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((v) => isBooleanRecord(v));
}

function extractDoneMap(payload: unknown): GoalDoneMap | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (isGoalDoneMap(record)) return record;
  if (isGoalDoneMap(record.done)) return record.done;

  if (
    record.state &&
    typeof record.state === "object" &&
    !Array.isArray(record.state)
  ) {
    const stateRecord = record.state as Record<string, unknown>;
    if (isGoalDoneMap(stateRecord.done)) return stateRecord.done;
  }

  if (
    record.data &&
    typeof record.data === "object" &&
    !Array.isArray(record.data)
  ) {
    const dataRecord = record.data as Record<string, unknown>;
    if (isGoalDoneMap(dataRecord.done)) return dataRecord.done;
  }

  return null;
}

function readGoalDoneMap(): GoalDoneMap {
  const userId = getActiveUserId();
  if (!userId) return {};

  const keys = ["goals:done:v1", "cache:goals:v1"] as const;

  for (const key of keys) {
    try {
      const raw = getScopedStorageItem(key, userId);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const doneMap = extractDoneMap(parsed);
      if (doneMap) return doneMap;
    } catch {
      // ignore
    }
  }

  return {};
}

function isStepDone(
  goalId: string | undefined,
  stepId: string | undefined,
  doneMap: GoalDoneMap,
): boolean {
  if (!goalId || !stepId) return false;
  return Boolean(doneMap[goalId]?.[stepId]);
}

function getStepInfo(
  goal: GoalLike,
  doneMap: GoalDoneMap,
  today: string,
): {
  overdueCount: number;
  overdueStepLabel: string | null;
  overdueStepDate: string | null;
  nextStepLabel: string | null;
  nextStepDate: string | null;
} {
  const steps = Array.isArray(goal.steps) ? goal.steps : [];
  const incompleteSteps = steps.filter((step) => {
    if (!step?.id) return true;
    return !isStepDone(goal.id, step.id, doneMap);
  });

  const overdueSteps = incompleteSteps
    .filter(
      (step) =>
        typeof step.idealFinish === "string" &&
        step.idealFinish.length > 0 &&
        step.idealFinish < today,
    )
    .sort((a, b) => (a.idealFinish ?? "").localeCompare(b.idealFinish ?? ""));

  const overdueStep = overdueSteps[0] ?? null;

  const upcomingSteps = incompleteSteps
    .filter((step) => !step.idealFinish || step.idealFinish >= today)
    .sort((a, b) => {
      if (!a.idealFinish && !b.idealFinish) return 0;
      if (!a.idealFinish) return 1;
      if (!b.idealFinish) return -1;
      return a.idealFinish.localeCompare(b.idealFinish);
    });

  const nextStep = upcomingSteps[0] ?? null;

  return {
    overdueCount: overdueSteps.length,
    overdueStepLabel:
      typeof overdueStep?.label === "string" &&
      overdueStep.label.trim().length > 0
        ? overdueStep.label
        : null,
    overdueStepDate: overdueStep?.idealFinish ?? null,
    nextStepLabel:
      typeof nextStep?.label === "string" && nextStep.label.trim().length > 0
        ? nextStep.label
        : null,
    nextStepDate: nextStep?.idealFinish ?? null,
  };
}

function countOverdueIncompleteSteps(
  goals: GoalLike[],
  doneMap: GoalDoneMap,
  today: string,
): number {
  return goals.reduce((count, goal) => {
    if (!goal.id || !Array.isArray(goal.steps)) return count;

    return (
      count +
      goal.steps.filter((step) => {
        if (!step?.id) return false;
        if (isStepDone(goal.id, step.id, doneMap)) return false;

        return (
          typeof step.idealFinish === "string" &&
          step.idealFinish.length > 0 &&
          step.idealFinish < today
        );
      }).length
    );
  }, 0);
}

function readReadingState(): ReadingState {
  try {
    const raw = getScopedStorageItem(
      "daily-life:reading:v2",
      getActiveUserId(),
    );
    if (!raw) {
      return {
        currentBookTitle: null,
        author: null,
        currentPage: null,
        totalPages: null,
        streak: 0,
        targetPages: 20,
      };
    }

    const parsed = JSON.parse(raw) as {
      current?: {
        title?: string;
        author?: string;
        currentPage?: string | number;
        totalPages?: string | number;
      };
      streak?: number;
      lastReadDate?: string | null;
      dailyGoalPages?: string | number;
    };

    const book = parsed.current;

    return {
      currentBookTitle:
        typeof book?.title === "string" &&
        book.title.trim().length > 0 &&
        book.title !== "Current book"
          ? book.title
          : null,
      author:
        typeof book?.author === "string" && book.author.trim().length > 0
          ? book.author
          : null,
      currentPage:
        book?.currentPage != null
          ? parseInt(String(book.currentPage), 10) || null
          : null,
      totalPages:
        book?.totalPages != null
          ? parseInt(String(book.totalPages), 10) || null
          : null,
      streak: getDisplayedReadingStreak(
        typeof parsed.streak === "number" ? parsed.streak : 0,
        typeof parsed.lastReadDate === "string" ? parsed.lastReadDate : null,
        getLocalDateKey(),
      ),
      targetPages:
        parsed.dailyGoalPages != null
          ? parseInt(String(parsed.dailyGoalPages), 10) || 20
          : 20,
    };
  } catch {
    return {
      currentBookTitle: null,
      author: null,
      currentPage: null,
      totalPages: null,
      streak: 0,
      targetPages: 20,
    };
  }
}

function readTodosSignal(): AISignals["todos"] {
  try {
    const userId = getActiveUserId();
    if (!userId) return null;

    const raw = getScopedStorageItem("cache:todos:v1", userId);
    if (!raw) return null;

    const todos = JSON.parse(raw) as Array<{
      done?: boolean;
      created_at?: string;
    }>;

    if (!Array.isArray(todos)) return null;

    const today = todayISO();
    const todayTodos = todos.filter(
      (todo) =>
        typeof todo.created_at === "string" &&
        todo.created_at.slice(0, 10) === today,
    );

    return {
      totalToday: todayTodos.length,
      doneToday: todayTodos.filter((todo) => Boolean(todo.done)).length,
      totalCount: todos.length,
      openCount: todos.filter((todo) => !todo.done).length,
    };
  } catch {
    return null;
  }
}

function readScheduleSignal(): AISignals["schedule"] {
  return null;
}

function countMealsLogged(log: unknown): number {
  if (!log || typeof log !== "object") return 0;

  const nutrition = log as {
    eaten?: Record<string, boolean>;
    customEntries?: unknown[];
  };

  const preset = Object.values(nutrition.eaten ?? {}).filter(Boolean).length;
  const custom = Array.isArray(nutrition.customEntries)
    ? nutrition.customEntries.length
    : 0;

  return preset + custom;
}

export async function buildAISignals(forceRefresh = false): Promise<AISignals> {
  const cached = !forceRefresh ? readCache() : null;

  const [nutritionLog, waterLog] = await Promise.all([
    Promise.resolve(loadNutritionLog()).catch(() => null),
    Promise.resolve(loadWaterLog()).catch(() => null),
  ]);
  const mealsLoggedToday = countMealsLogged(nutritionLog);
  const water = {
    ml: waterLog?.ml ?? 0,
    targetMl: waterLog?.targetMl ?? 2500,
    remainingMl: Math.max((waterLog?.targetMl ?? 2500) - (waterLog?.ml ?? 0), 0),
    goalHit: (waterLog?.ml ?? 0) >= (waterLog?.targetMl ?? 2500),
  };

  if (cached) {
    const updated: AISignals = {
      ...cached,
      builtAt: new Date().toISOString(),
      nutrition: {
        ...cached.nutrition,
        mealsLoggedToday,
      },
      water,
    };

    writeCache(updated);
    return updated;
  }

  const [profile, goals, prGoals, nutritionPhase] = await Promise.all([
    Promise.resolve(loadProfile()).catch(() => null),
    Promise.resolve(loadUserGoals()).catch(() => []),
    Promise.resolve(loadPRGoals()).catch(() => []),
    Promise.resolve(loadPhase()).catch(() => "maintain" as const),
  ]);

  const reading = readReadingState();
  const todos = readTodosSignal();
  const schedule = readScheduleSignal();
  const doneMap = readGoalDoneMap();

  const modules = normalizeModules(profile?.enabled_modules);

  const goalList = Array.isArray(goals) ? (goals as GoalLike[]) : [];
  const sortedGoals = [...goalList].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority),
  );

  const today = todayISO();
  const highestPriorityGoal = sortedGoals[0] ?? null;

  const goalEntries = sortedGoals.map((goal) => {
    const stepInfo = getStepInfo(goal, doneMap, today);
    return {
      goal,
      stepInfo,
      urgencyRank:
        stepInfo.overdueStepLabel
          ? 0
          : stepUrgencyRank(stepInfo.nextStepDate, today),
    };
  });

  goalEntries.sort((a, b) => {
    if (a.urgencyRank !== b.urgencyRank) return a.urgencyRank - b.urgencyRank;

    if (a.urgencyRank === 0) {
      if (a.stepInfo.overdueCount !== b.stepInfo.overdueCount) {
        return b.stepInfo.overdueCount - a.stepInfo.overdueCount;
      }
      const aDate = a.stepInfo.overdueStepDate ?? "9999-99-99";
      const bDate = b.stepInfo.overdueStepDate ?? "9999-99-99";
      if (aDate !== bDate) return aDate.localeCompare(bDate);
    } else {
      const aDate = a.stepInfo.nextStepDate ?? "9999-99-99";
      const bDate = b.stepInfo.nextStepDate ?? "9999-99-99";
      if (aDate !== bDate) return aDate.localeCompare(bDate);
    }

    const priorityDiff =
      priorityRank(a.goal.priority) - priorityRank(b.goal.priority);
    if (priorityDiff !== 0) return priorityDiff;

    return (a.goal.title ?? "").localeCompare(b.goal.title ?? "");
  });

  const mostUrgentGoalEntry = goalEntries[0] ?? null;

  const overdueSteps = countOverdueIncompleteSteps(goalList, doneMap, today);

  const profileMacros =
    nutritionPhase === "cut" ? profile?.macro_cut : profile?.macro_maintain;

  const signals: AISignals = {
    builtAt: new Date().toISOString(),
    modules,
    profile: {
      displayName: profile?.display_name ?? null,
      activityLevel: profile?.activity_level ?? null,
      weeklyScheduleSummary: formatWeeklyScheduleSummary(
        profile?.weekly_schedule,
      ),
      dailyReadingGoal: profile?.daily_reading_goal ?? null,
      measurementSystem: profile?.measurement_system ?? null,
      dateFormat: profile?.date_format ?? null,
      timeFormat: profile?.time_format ?? null,
      tier: profile?.tier ?? null,
    },
    goals: {
      count: goalList.length,
      highestPriorityTitle: highestPriorityGoal?.title ?? null,
      highestPriority: highestPriorityGoal?.priority ?? null,
      overdueSteps,
      nextStepLabel:
        mostUrgentGoalEntry?.stepInfo.overdueStepLabel ??
        mostUrgentGoalEntry?.stepInfo.nextStepLabel ??
        null,
      topGoals: goalEntries.slice(0, 10).map(({ goal, stepInfo }) => {
        return {
          id: goal.id ?? "",
          title: goal.title ?? "Untitled goal",
          priority: goal.priority ?? null,
          ...stepInfo,
          stepCount: Array.isArray(goal.steps) ? goal.steps.length : 0,
        };
      }),
    },
    nutrition: {
      phase: nutritionPhase === "cut" ? "cut" : "maintain",
      mealsLoggedToday,
      calorieTarget: profileMacros?.cal ?? null,
      proteinTarget: profileMacros?.protein ?? null,
    },
    water,
    reading,
    fitness: {
      daysSinceWorkout: getDaysSinceWorkout(prGoals),
      strongestLift: getStrongestLiftLabel(prGoals),
      weakestLift: getWeakestLiftLabel(prGoals),
    },
    todos,
    schedule,
  };

  writeCache(signals);
  return signals;
}
