import { loadProfile } from '@/features/onboarding/profileStorage';
import { DEFAULT_MODULES, type ModuleId } from '@/features/modules/modules';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import {
  getDaysSinceWorkout,
  getStrongestLiftLabel,
  getWeakestLiftLabel,
  loadPRGoals,
} from '@/features/fitness/fitnessStorage';
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

type ReadingState = {
  currentBookTitle: string | null;
  author: string | null;
  currentPage: number | null;
  totalPages: number | null;
  streak: number;
  pagesReadToday: number;
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

function getFirstStepLabel(goal: GoalLike | null | undefined): string | null {
  if (
    Array.isArray(goal?.steps) &&
    typeof goal.steps[0]?.label === 'string' &&
    goal.steps[0].label.trim().length > 0
  ) {
    return goal.steps[0].label;
  }

  return null;
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
        pagesReadToday: 0,
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
      book?: {
        title?: string;
        author?: string;
        currentPage?: string | number;
        totalPages?: string | number;
      };
      // New schema: streak is a top-level number
      streak?: number | { streak?: number };
      // Old schema (legacy)
      minutes?: { minutes?: number; target?: number };
      dailyGoalPages?: string | number;
    };

    const book = parsed.current ?? parsed.book;

    // Handle both new schema (streak: number) and old schema (streak: { streak: number })
    const streakVal =
      typeof parsed.streak === 'number'
        ? parsed.streak
        : typeof parsed.streak === 'object' && typeof parsed.streak?.streak === 'number'
          ? parsed.streak.streak
          : 0;

    return {
      currentBookTitle:
        typeof book?.title === 'string' && book.title.trim().length > 0 && book.title !== 'Current book'
          ? book.title
          : null,
      author: typeof book?.author === 'string' && book.author.trim().length > 0 ? book.author : null,
      currentPage:
        book?.currentPage != null ? parseInt(String(book.currentPage)) || null : null,
      totalPages:
        book?.totalPages != null ? parseInt(String(book.totalPages)) || null : null,
      streak: streakVal,
      pagesReadToday: 0, // not tracked per-day in localStorage — streak is what matters
      targetPages:
        typeof parsed.dailyGoalPages === 'string' || typeof parsed.dailyGoalPages === 'number'
          ? parseInt(String(parsed.dailyGoalPages)) || 20
          : 20,
    };
  } catch {
    return {
      currentBookTitle: null,
      author: null,
      currentPage: null,
      totalPages: null,
      streak: 0,
      pagesReadToday: 0,
      targetPages: 20,
    };
  }
}

function readTodosSignal(): AISignals['todos'] {
  try {
    // Try new cache key first, fall back to legacy
    const raw = localStorage.getItem('cache:todos:v1') ?? localStorage.getItem('todos_v1');
    if (!raw) return null;

    const todos = JSON.parse(raw) as Array<{
      done?: boolean;
      created_at?: string;
    }>;

    if (!Array.isArray(todos)) return null;

    // All todos count (not just today's — todos aren't date-filtered)
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

export async function buildAISignals(
  forceRefresh = false,
): Promise<AISignals> {
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

  const modules = normalizeModules(profile?.enabled_modules);

  const goalList = Array.isArray(goals) ? (goals as GoalLike[]) : [];
  const sortedGoals = [...goalList].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority),
  );
  const highestPriorityGoal = sortedGoals[0] ?? null;
  const today = getLocalDateKey();

  const overdueSteps = goalList.reduce((count, goal) => {
    const steps = Array.isArray(goal.steps) ? goal.steps : [];

    return (
      count +
      steps.filter(
        (step) =>
          typeof step.idealFinish === 'string' &&
          step.idealFinish.length > 0 &&
          step.idealFinish < today,
      ).length
    );
  }, 0);

  const profileMacros =
    nutritionPhase === 'cut' ? profile?.macro_cut : profile?.macro_maintain;

  const mealsLoggedToday =
    nutritionLog && typeof nutritionLog === 'object'
      ? (
          // Count custom entries (the current logging method)
          ((nutritionLog as { customEntries?: unknown[] }).customEntries ?? []).length +
          // Also count legacy eaten checkboxes for backwards compatibility
          Object.values(
            (nutritionLog as { eaten?: Record<string, boolean> }).eaten ?? {},
          ).filter(Boolean).length
        )
      : 0;

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
      nextStepLabel: getFirstStepLabel(highestPriorityGoal),
      topGoals: sortedGoals.slice(0, 5).map((goal) => ({
        title: goal.title ?? 'Untitled goal',
        priority: goal.priority ?? null,
        nextStepLabel: getFirstStepLabel(goal),
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