import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACHIEVEMENTS,
  type AchievementCheckData,
} from './achievementDefinitions';
import {
  loadUnlockedAchievements,
  seedAchievements,
  unlockAchievement,
  ACHIEVEMENTS_CHANGED_EVENT,
} from './achievementStorage';
import {
  loadPRGoals,
  type PRGoal,
  type PREntry,
  type MetricType,
} from '@/features/fitness/fitnessStorage';
import { loadNutritionLog } from '@/features/nutrition/nutritionStorage';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import { loadReadingInputs } from '@/features/reading/readingStorage';
import { loadModuleState } from '@/features/goals/modules/goalModuleStorage';
import { listTodos } from '@/features/todos/todoStorage';
import { loadProfile } from '@/features/onboarding/profileStorage';
import { supabase } from '@/lib/supabaseClient';
import type { UnlockedAchievement } from './achievementDefinitions';
import { getLocalDateKey } from '@/hooks/useTodayDate';

type LegacyFitnessLift = {
  label: string;
  goal: number;
  unit: MetricType;
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
          history: Array.isArray(goal.history) ? goal.history : [],
        },
      ]),
    ),
  };
}

async function buildCheckData(): Promise<AchievementCheckData> {
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
    (profile as unknown as { enabled_modules?: string[] })?.enabled_modules ??
    [];

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
    fitness: toLegacyFitness(prGoals) as AchievementCheckData['fitness'],
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

export type UseAchievementsResult = {
  unlocked: UnlockedAchievement[];
  newlyUnlocked: UnlockedAchievement[];
  dismissNew: () => void;
  loading: boolean;
};

export function useAchievements(): UseAchievementsResult {
  const [unlocked, setUnlocked] =
    useState<UnlockedAchievement[]>(seedAchievements);
  const [newlyUnlocked, setNewlyUnlocked] = useState<UnlockedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const checkingRef = useRef(false);

  const check = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      const [existing, checkData] = await Promise.all([
        loadUnlockedAchievements(),
        buildCheckData(),
      ]);

      const existingIds = new Set(existing.map((a) => a.id));
      const newlyEarned: UnlockedAchievement[] = [];

      for (const def of ACHIEVEMENTS) {
        if (existingIds.has(def.id)) continue;

        try {
          if (def.check(checkData)) {
            const isNew = await unlockAchievement(def.id);
            if (isNew) {
              newlyEarned.push({ id: def.id, unlockedAt: getLocalDateKey() });
            }
          }
        } catch {
          // ignore individual check failure
        }
      }

      const updated = await loadUnlockedAchievements();
      setUnlocked(updated);

      if (newlyEarned.length > 0) {
        setNewlyUnlocked((prev) => [...prev, ...newlyEarned]);
      }
    } finally {
      checkingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void check();

    const events = [
      'fitness:changed',
      'nutrition:changed',
      'todos:changed',
      'schedule:changed',
      'daily-life:reading:changed',
      'goal_module:changed',
      ACHIEVEMENTS_CHANGED_EVENT,
    ];

    events.forEach((e) => window.addEventListener(e, check));
    return () => events.forEach((e) => window.removeEventListener(e, check));
  }, [check]);

  const dismissNew = useCallback(() => {
    setNewlyUnlocked((prev) => prev.slice(1));
  }, []);

  return { unlocked, newlyUnlocked, dismissNew, loading };
}