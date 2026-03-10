/**
 * useAchievements.ts
 *
 * Checks all achievement conditions against live data and unlocks newly
 * earned badges. Exposes a queue of newly-unlocked achievements so the
 * UI can show the celebration modal one at a time.
 *
 * Usage:
 *   const { unlocked, newlyUnlocked, dismissNew } = useAchievements();
 */

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
import { loadFitness } from '@/features/fitness/fitnessStorage';
import { loadNutritionLog } from '@/features/nutrition/nutritionStorage';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import { loadReadingInputs } from '@/features/reading/readingStorage';
import { loadModuleState } from '@/features/goals/modules/goalModuleStorage';
import { listTodos } from '@/features/todos/todoStorage';
import { loadProfile } from '@/features/onboarding/profileStorage';
import { supabase } from '@/lib/supabaseClient';
import type { UnlockedAchievement } from './achievementDefinitions';
import { getLocalDateKey } from '@/hooks/useTodayDate';
getLocalDateKey

// ── Data snapshot builder ─────────────────────────────────────────────────────

async function buildCheckData(): Promise<AchievementCheckData> {
  const [goals, fitness, nutritionLog, reading, todos, profile] =
    await Promise.all([
      loadUserGoals().catch(() => []),
      loadFitness().catch(() => null),
      loadNutritionLog().catch(() => null),
      loadReadingInputs().catch(() => null),
      listTodos().catch(() => []),
      loadProfile().catch(() => null),
    ]);

  // Reading streak
  let readingStreak = 0;
  try {
    const s = await loadModuleState<{ streak: number }>(
      'reading',
      'reading_streak',
      { streak: 0 },
    );
    readingStreak = s?.streak ?? 0;
  } catch {
    /* ignore */
  }

  // Books completed = reading.completed array length
  const readingBooksCompleted = (reading?.completed ?? []).length;

  // Nutrition logs across multiple days — fetch last 30 days
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
    /* ignore */
  }

  // Todos completed total (count done=true rows)
  const todosCompletedTotal = todos.filter((t) => t.done).length;

  // Enabled modules
  const enabledModules =
    (profile as unknown as { enabled_modules?: string[] })?.enabled_modules ??
    [];

  // Account age
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
    /* ignore */
  }

  return {
    goals,
    fitness,
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

// ── Hook ──────────────────────────────────────────────────────────────────────

export type UseAchievementsResult = {
  /** All achievements the user has unlocked */
  unlocked: UnlockedAchievement[];
  /** Queue of newly-unlocked achievements to show modals for */
  newlyUnlocked: UnlockedAchievement[];
  /** Call after showing modal to dismiss the front of the queue */
  dismissNew: () => void;
  /** Is the initial load still in progress? */
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
        if (existingIds.has(def.id)) continue; // already unlocked
        try {
          if (def.check(checkData)) {
            const isNew = await unlockAchievement(def.id);
            if (isNew) {
              newlyEarned.push({ id: def.id, unlockedAt: getLocalDateKey() });
            }
          }
        } catch {
          /* individual check failure shouldn't crash */
        }
      }

      // Reload full list
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
    check();

    // Re-check when any module emits a change
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
