import { loadProfile } from '@/features/onboarding/profileStorage';
import { DEFAULT_MODULES, type ModuleId } from '@/features/modules/modules';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import { loadPRGoals, type PRGoal } from '@/features/fitness/fitnessStorage';
import {
  loadNutritionLog,
  loadPhase,
} from '@/features/nutrition/nutritionStorage';
import { getLocalDateKey } from '@/hooks/useTodayDate';

const CACHE_KEY = 'cache:ai-signals:v1';
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
  pagesToday: number;
  targetPages: number;
};

export type AISignals = {
  builtAt: string;
  modules: ModuleId[];
  profile: {
    displayName: string | null;
    activityLevel: string | null;
    preferredScheduleView: string | null;
    dailyReadingGoal: number | null;
    tier: 'free' | 'pro' | 'pro_max' | null;
  };
  goals: {
    count: number;
    highestPriorityTitle: string | null;
    highestPriority: string | null;
    overdueSteps: number;
    nextStepLabel: string | null;
    topGoals: Array<{
      title: string;
      priority: string | null;
      nextStepLabel: string | null;
      stepCount: number;
    }>;
  };
  nutrition: {
    phase: 'maintain' | 'cut';
    mealsLoggedToday: number;
    calorieTarget: number | null;
    proteinTarget: number | null;
  };
  reading: ReadingState;
  fitness: {
    daysSinceWorkout: number | null;
    strongestLift: string | null;
    weakestLift: string | null;
  };
  todos: {
    doneToday: number;
    totalToday: number;
  } | null;
  schedule: {
    completedBlocks: number;
    totalBlocks: number;
  } | null;
};

function readCache(): AISignals | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
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
    localStorage.setItem(CACHE_KEY, JSON.stringify(signals));
  } catch {
    // ignore
  }
}

function normalizeModules(modules: ModuleId[] | null | undefined): ModuleId[] {
  return Array.isArray(modules) && modules.length > 0
    ? modules
    : [...DEFAULT_MODULES];
}

function priorityRank(priority: string | undefined): number {
  if (priority === 'high') return 0;
  if (priority === 'medium') return 1;
  if (priority === 'low') return 2;
  return 99;
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((v) => typeof v === 'boolean');
}

function isGoalDoneMap(value: unknown): value is GoalDoneMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((v) => isBooleanRecord(v));
}

function extractDoneMap(payload: unknown): GoalDoneMap | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (isGoalDoneMap(record)) return record;
  if (isGoalDoneMap(record.done)) return record.done;
  if (
    record.state &&
    typeof record.state === 'object' &&
    !Array.isArray(record.state) &&
    isGoalDoneMap((record.state as Record<string, unknown>).done)
  ) {
    return (record.state as Record<string, GoalDoneMap>).done;
  }
  if (
    record.data &&
    typeof record.data === 'object' &&
    !Array.isArray(record.data) &&
    isGoalDoneMap((record.data as Record<string, unknown>).done)
  ) {
    return (record.data as Record<string, GoalDoneMap>).done;
  }

  return null;
}

function readGoalDoneMap(): GoalDoneMap {
  const likelyKeys = [
    'goal-store',
    'goal_store',
    'goals-store',
    'goals_store',
    'goalStore',
    'goalsStore',
    'cache:goal_store:v1',
    'cache:goals_store:v1',
    'daily-life:goal-store:v1',
    'daily-life:goals-store:v1',
  ];

  for (const key of likelyKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const doneMap = extractDoneMap(parsed);
      if (doneMap) return doneMap;
    } catch {
      // ignore and continue
    }
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const doneMap = extractDoneMap(parsed);
      if (doneMap) return doneMap;
    } catch {
      // ignore and continue
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

function getFirstIncompleteStepLabel(
  goal: GoalLike | null | undefined,
  doneMap: GoalDoneMap,
): string | null {
  if (!goal?.id || !Array.isArray(goal.steps)) return null;

  const nextIncomplete = goal.steps.find((step) => {
    if (!step?.id) return true;
    return !isStepDone(goal.id, step.id, doneMap);
  });

  return typeof nextIncomplete?.label === 'string' &&
    nextIncomplete.label.trim().length > 0
    ? nextIncomplete.label
    : null;
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
          typeof step.idealFinish === 'string' &&
          step.idealFinish.length > 0 &&
          step.idealFinish < today
        );
      }).length
    );
  }, 0);
}

function readReadingState(): ReadingState {
  try {
    const raw = localStorage.getItem('daily-life:reading:v2');
    if (!raw) {
      return {
        currentBookTitle: null,
        author: null,
        currentPage: null,
        totalPages: null,
        streak: 0,
        pagesToday: 0,
        targetPages: 30,
      };
    }

    const parsed = JSON.parse(raw) as {
      current?: {
        title?: string;
        author?: string;
        currentPage?: number | string;
        totalPages?: number | string;
      };
      book?: {
        title?: string;
        author?: string;
        currentPage?: number | string;
        totalPages?: number | string;
      };
      streak?: number | { streak?: number };
      pages?: { pages?: number; target?: number };
      dailyGoalPages?: string | number;
    };

    const book = parsed.current ?? parsed.book;
    const streakVal =
      typeof parsed.streak === 'number'
        ? parsed.streak
        : typeof parsed.streak === 'object' &&
            typeof parsed.streak?.streak === 'number'
          ? parsed.streak.streak
          : 0;

    return {
      currentBookTitle:
        typeof book?.title === 'string' &&
        book.title.trim().length > 0 &&
        book.title !== 'Current book'
          ? book.title
          : null,
      author:
        typeof book?.author === 'string' && book.author.trim().length > 0
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
      streak: streakVal,
      pagesToday:
        typeof parsed.pages?.pages === 'number'
          ? parsed.pages.pages
          : 0,
      targetPages:
        typeof parsed.pages?.target === 'number'
          ? parsed.pages.target
          : 30,
    };
  } catch {
    return {
      currentBookTitle: null,
      author: null,
      currentPage: null,
      totalPages: null,
      streak: 0,
      pagesToday: 0,
      targetPages: 30,
    };
  }
}

function readTodosSignal(): AISignals['todos'] {
  try {
    const raw =
      localStorage.getItem('cache:todos:v1') ?? localStorage.getItem('todos_v1');
    if (!raw) return null;

    const todos = JSON.parse(raw) as Array<{
      done?: boolean;
      created_at?: string;
    }>;

    if (!Array.isArray(todos)) return null;

    return {
      totalToday: todos.length,
      doneToday: todos.filter((todo) => Boolean(todo.done)).length,
    };
  } catch {
    return null;
  }
}

function readScheduleSignal(): AISignals['schedule'] {
  return null;
}

function daysSince(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const t = new Date(isoDate).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function getLatestWorkoutDate(prGoals: PRGoal[]): string | null {
  const allWorkoutDates = prGoals.flatMap((goal) =>
    Array.isArray(goal.history)
      ? goal.history
          .map((entry) => (typeof entry.date === 'string' ? entry.date : null))
          .filter((date): date is string => Boolean(date))
      : [],
  );

  return [...allWorkoutDates].sort().at(-1) ?? null;
}

function getLiftProgress(prGoals: PRGoal[]) {
  return prGoals
    .map((goal) => {
      const history = Array.isArray(goal.history) ? goal.history : [];

      const best = history.reduce<number | null>((acc, entry) => {
        if (typeof entry.value !== 'number') return acc;
        if (acc === null || entry.value > acc) return entry.value;
        return acc;
      }, null);

      const pct =
        best !== null && typeof goal.goal === 'number' && goal.goal > 0
          ? Math.round((best / goal.goal) * 100)
          : null;

      return {
        label: goal.label ?? null,
        pct,
      };
    })
    .filter(
      (goal): goal is { label: string; pct: number | null } =>
        typeof goal.label === 'string',
    );
}

export async function buildAISignals(forceRefresh = false): Promise<AISignals> {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return cached;
  }

  const [profile, goals, prGoals, nutritionLog, nutritionPhase] =
    await Promise.all([
      Promise.resolve(loadProfile()).catch(() => null),
      Promise.resolve(loadUserGoals()).catch(() => []),
      Promise.resolve(loadPRGoals()).catch(() => []),
      Promise.resolve(loadNutritionLog()).catch(() => null),
      Promise.resolve(loadPhase()).catch(() => 'maintain' as const),
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
  const highestPriorityGoal = sortedGoals[0] ?? null;
  const today = getLocalDateKey();

  const overdueSteps = countOverdueIncompleteSteps(goalList, doneMap, today);

  const latestWorkoutDate = getLatestWorkoutDate(prGoals);
  const liftProgress = getLiftProgress(prGoals);

  const strongestLift =
    [...liftProgress]
      .filter((lift) => typeof lift.pct === 'number')
      .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0]?.label ?? null;

  const weakestLift =
    [...liftProgress]
      .filter((lift) => typeof lift.pct === 'number')
      .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))[0]?.label ?? null;

  const profileMacros =
    nutritionPhase === 'cut' ? profile?.macro_cut : profile?.macro_maintain;

  const presetMealsLogged =
    nutritionLog && typeof nutritionLog === 'object'
      ? Object.values(
          (nutritionLog as { eaten?: Record<string, boolean> }).eaten ?? {},
        ).filter(Boolean).length
      : 0;

  const customEntriesLogged =
    nutritionLog &&
    typeof nutritionLog === 'object' &&
    Array.isArray(
      (nutritionLog as { customEntries?: unknown[] }).customEntries,
    )
      ? (nutritionLog as { customEntries?: unknown[] }).customEntries!.length
      : 0;

  const mealsLoggedToday = presetMealsLogged + customEntriesLogged;

  const signals: AISignals = {
    builtAt: new Date().toISOString(),
    modules,
    profile: {
      displayName: profile?.display_name ?? null,
      activityLevel: profile?.activity_level ?? null,
      preferredScheduleView: profile?.default_schedule_view ?? null,
      dailyReadingGoal: profile?.daily_reading_goal ?? null,
      tier: profile?.tier ?? null,
    },
    goals: {
      count: goalList.length,
      highestPriorityTitle: highestPriorityGoal?.title ?? null,
      highestPriority: highestPriorityGoal?.priority ?? null,
      overdueSteps,
      nextStepLabel: getFirstIncompleteStepLabel(highestPriorityGoal, doneMap),
      topGoals: sortedGoals.slice(0, 5).map((goal) => ({
        title: goal.title ?? 'Untitled goal',
        priority: goal.priority ?? null,
        nextStepLabel: getFirstIncompleteStepLabel(goal, doneMap),
        stepCount: Array.isArray(goal.steps) ? goal.steps.length : 0,
      })),
    },
    nutrition: {
      phase: nutritionPhase === 'cut' ? 'cut' : 'maintain',
      mealsLoggedToday,
      calorieTarget: profileMacros?.cal ?? null,
      proteinTarget: profileMacros?.protein ?? null,
    },
    reading,
    fitness: {
      daysSinceWorkout: daysSince(latestWorkoutDate),
      strongestLift,
      weakestLift,
    },
    todos,
    schedule,
  };

  writeCache(signals);
  return signals;
}
