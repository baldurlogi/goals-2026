import { loadProfile } from '@/features/onboarding/profileStorage';
import { DEFAULT_MODULES, type ModuleId } from '@/features/modules/modules';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import { loadFitness } from '@/features/fitness/fitnessStorage';
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

type FitnessHistoryEntryLike = {
  value?: number;
  date?: string;
};

type FitnessLiftLike = {
  label?: string;
  goal?: number;
  unit?: string;
  history?: FitnessHistoryEntryLike[];
};

type FitnessStoreLike = {
  lifts?: Record<string, FitnessLiftLike>;
};

type ReadingState = {
  currentBookTitle: string | null;
  author: string | null;
  currentPage: number | null;
  totalPages: number | null;
  streak: number;
  minutesToday: number;
  targetMinutes: number;
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
        minutesToday: 0,
        targetMinutes: 30,
      };
    }

    const parsed = JSON.parse(raw) as {
      current?: {
        title?: string;
        author?: string;
        currentPage?: number;
        totalPages?: number;
      };
      book?: {
        title?: string;
        author?: string;
        currentPage?: number;
        totalPages?: number;
      };
      streak?: { streak?: number };
      minutes?: { minutes?: number; target?: number };
    };

    const book = parsed.current ?? parsed.book;

    return {
      currentBookTitle:
        typeof book?.title === 'string' && book.title !== 'Current book'
          ? book.title
          : null,
      author: typeof book?.author === 'string' ? book.author : null,
      currentPage:
        typeof book?.currentPage === 'number' ? book.currentPage : null,
      totalPages: typeof book?.totalPages === 'number' ? book.totalPages : null,
      streak:
        typeof parsed.streak?.streak === 'number' ? parsed.streak.streak : 0,
      minutesToday:
        typeof parsed.minutes?.minutes === 'number'
          ? parsed.minutes.minutes
          : 0,
      targetMinutes:
        typeof parsed.minutes?.target === 'number' ? parsed.minutes.target : 30,
    };
  } catch {
    return {
      currentBookTitle: null,
      author: null,
      currentPage: null,
      totalPages: null,
      streak: 0,
      minutesToday: 0,
      targetMinutes: 30,
    };
  }
}

function readTodosSignal(): AISignals['todos'] {
  try {
    const raw = localStorage.getItem('todos_v1');
    if (!raw) return null;

    const todos = JSON.parse(raw) as Array<{
      done?: boolean;
      created_at?: string;
    }>;

    if (!Array.isArray(todos)) return null;

    const today = getLocalDateKey();
    const todayTodos = todos.filter(
      (t) =>
        typeof t.created_at === 'string' && t.created_at.slice(0, 10) === today,
    );

    return {
      totalToday: todayTodos.length,
      doneToday: todayTodos.filter((t) => Boolean(t.done)).length,
    };
  } catch {
    return null;
  }
}

function readScheduleSignal(): AISignals['schedule'] {
  return null;
}

function priorityRank(priority: string | undefined): number {
  if (priority === 'high') return 0;
  if (priority === 'medium') return 1;
  if (priority === 'low') return 2;
  return 99;
}

function daysSince(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const t = new Date(isoDate).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export async function buildAISignals(forceRefresh = false): Promise<AISignals> {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return cached;
  }

  const [profile, goals, fitnessStore, nutritionLog, nutritionPhase] =
    await Promise.all([
      Promise.resolve(loadProfile()).catch(() => null),
      Promise.resolve(loadUserGoals()).catch(() => []),
      Promise.resolve(loadFitness()).catch(() => null),
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
        (s) =>
          typeof s.idealFinish === 'string' &&
          s.idealFinish.length > 0 &&
          s.idealFinish < today,
      ).length
    );
  }, 0);

  const fitness = (fitnessStore ?? null) as FitnessStoreLike | null;
  const lifts = fitness?.lifts ? Object.values(fitness.lifts) : [];

  const allWorkoutDates = lifts.flatMap((lift) =>
    Array.isArray(lift.history)
      ? (lift.history
          .map((entry) => (typeof entry.date === 'string' ? entry.date : null))
          .filter(Boolean) as string[])
      : [],
  );

  const latestWorkoutDate = [...allWorkoutDates].sort().at(-1) ?? null;

  const liftProgress = lifts
    .map((lift) => {
      const history = Array.isArray(lift.history) ? lift.history : [];
      const best = history.reduce<number | null>((acc, entry) => {
        if (typeof entry.value !== 'number') return acc;
        if (acc === null || entry.value > acc) return entry.value;
        return acc;
      }, null);

      const goal = typeof lift.goal === 'number' ? lift.goal : null;
      const pct =
        best !== null && goal && goal > 0
          ? Math.round((best / goal) * 100)
          : null;

      return {
        label: lift.label ?? null,
        pct,
      };
    })
    .filter((lift) => typeof lift.label === 'string');

  const strongestLift =
    [...liftProgress]
      .filter((l) => typeof l.pct === 'number')
      .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0]?.label ?? null;

  const weakestLift =
    [...liftProgress]
      .filter((l) => typeof l.pct === 'number')
      .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))[0]?.label ?? null;

  const profileMacros =
    nutritionPhase === 'cut' ? profile?.macro_cut : profile?.macro_maintain;

  const mealsLoggedToday =
    nutritionLog && typeof nutritionLog === 'object'
      ? Object.values(
          (nutritionLog as { eaten?: Record<string, boolean> }).eaten ?? {},
        ).filter(Boolean).length
      : 0;

  const signals: AISignals = {
    builtAt: getLocalDateKey(),
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
      nextStepLabel:
        Array.isArray(highestPriorityGoal?.steps) &&
        typeof highestPriorityGoal?.steps[0]?.label === 'string'
          ? (highestPriorityGoal.steps[0].label ?? null)
          : null,
      topGoals: sortedGoals.slice(0, 5).map((goal) => ({
        title: goal.title ?? 'Untitled goal',
        priority: goal.priority ?? null,
        nextStepLabel:
          Array.isArray(goal.steps) && typeof goal.steps[0]?.label === 'string'
            ? (goal.steps[0].label ?? null)
            : null,
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
