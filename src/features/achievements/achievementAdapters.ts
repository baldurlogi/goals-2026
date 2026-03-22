import { loadPRGoals, type PRGoal } from '@/features/fitness/fitnessStorage';
import type { MetricType, PREntry } from '@/features/fitness/fitnessStorage';
import { loadNutritionLog } from '@/features/nutrition/nutritionStorage';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import { loadReadingInputs } from '@/features/reading/readingStorage';
import { loadModuleState } from '@/lib/goalModuleStorage';
import { listTodos } from '@/features/todos/todoStorage';
import { loadProfile } from '@/features/onboarding/profileStorage';
import { supabase } from '@/lib/supabaseClient';
import type { AchievementCheckData } from './achievementTypes';

type LegacyFitnessLift = {
  label: string;
  goal: number;
  unit: MetricType;
  category: PRGoal['category'];
  history: PREntry[];
};

type LegacyFitnessStore = {
  lifts: Record<string, LegacyFitnessLift>;
};

function toLegacyFitness(prGoals: PRGoal[]): LegacyFitnessStore {
  return {
    lifts: Object.fromEntries(
      prGoals.map((goal) => [
        goal.id,
        {
          label: goal.label,
          goal: goal.goal,
          unit: goal.unit,
          category: goal.category,
          history: Array.isArray(goal.history) ? goal.history : [],
        },
      ]),
    ),
  };
}

export async function buildAchievementCheckData(): Promise<AchievementCheckData> {
  const [goals, prGoals, nutritionLog, reading, todos, profile] =
    await Promise.all([
      loadUserGoals().catch(() => []),
      loadPRGoals().catch(() => []),
      loadNutritionLog().catch(() => null),
      loadReadingInputs().catch(() => null),
      listTodos().catch(() => []),
      loadProfile().catch(() => null),
    ]);

  let readingStreak = 0;
  try {
    const s = await loadModuleState<{ streak: number }>(
      'reading',
      'reading_streak',
      { streak: 0 },
    );
    readingStreak = s?.streak ?? 0;
  } catch {
    // ignore
  }

  const readingBooksCompleted = (reading?.completed ?? []).length;

  let nutritionLogsThisWeek = 0;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('nutrition_logs')
        .select('log_date')
        .eq('user_id', user.id);

      nutritionLogsThisWeek = (data ?? []).length;
    }
  } catch {
    // ignore
  }

  const todosCompletedTotal = todos.filter((t) => t.done).length;

  const enabledModules =
    (profile as unknown as { enabled_modules?: string[] })?.enabled_modules ?? [];

  let accountAgeDays = 0;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.created_at) {
      accountAgeDays = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / 86400000,
      );
    }
  } catch {
    // ignore
  }

  return {
    goals,
    fitness: toLegacyFitness(prGoals),
    nutritionLog,
    nutritionLogsThisWeek,
    reading,
    readingStreak,
    readingBooksCompleted,
    todos,
    todosCompletedTotal,
    enabledModules,
    accountAgeDays,
  };
}
