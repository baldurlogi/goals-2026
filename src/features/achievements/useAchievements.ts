import { useEffect, useState } from 'react';
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
  skills: Record<string, { history: PREntry[]; category?: string }>;
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
    skills: {},
  };
}

async function buildCheckData(): Promise<AchievementCheckData> {
  const [
    authResult,
    goals,
    prGoals,
    nutritionLog,
    reading,
    todos,
    profile,
    readingStreakState,
  ] = await Promise.all([
    supabase.auth.getUser().catch(() => ({ data: { user: null } })),
    loadUserGoals().catch(() => []),
    loadPRGoals().catch(() => []),
    loadNutritionLog().catch(() => null),
    loadReadingInputs().catch(() => null),
    listTodos().catch(() => []),
    loadProfile().catch(() => null),
    loadModuleState<{ streak: number }>('reading', 'reading_streak', {
      streak: 0,
    }).catch(() => ({ streak: 0 })),
  ]);

  const user = authResult?.data?.user ?? null;
  const readingStreak = readingStreakState?.streak ?? 0;
  const readingBooksCompleted = (reading?.completed ?? []).length;
  const todosCompletedTotal = todos.filter((t) => t.done).length;

  const enabledModules =
    (profile as unknown as { enabled_modules?: string[] })?.enabled_modules ??
    [];

  let nutritionLogsThisWeek = 0;
  if (user) {
    try {
      const { data } = await supabase
        .from('nutrition_logs')
        .select('log_date')
        .eq('user_id', user.id);

      nutritionLogsThisWeek = (data ?? []).length;
    } catch {
      // ignore
    }
  }

  const accountAgeDays = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)
    : 0;

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

type Listener = () => void;

const CHECK_COOLDOWN_MS = 5000;
const initialUnlocked = seedAchievements();

const store = {
  unlocked: initialUnlocked as UnlockedAchievement[],
  newlyUnlocked: [] as UnlockedAchievement[],
  loading: initialUnlocked.length === 0,
  checking: false,
  initialized: false,
  lastCheckAt: 0,
  listeners: new Set<Listener>(),
  eventsBound: false,
};

function emitChange() {
  store.listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  store.listeners.add(listener);

  return () => {
    store.listeners.delete(listener);
  };
}

function dismissNew() {
  if (store.newlyUnlocked.length === 0) return;
  store.newlyUnlocked = store.newlyUnlocked.slice(1);
  emitChange();
}

async function runCheck(force = false) {
  const now = Date.now();

  if (store.checking) return;
  if (
    !force &&
    store.initialized &&
    now - store.lastCheckAt < CHECK_COOLDOWN_MS
  ) {
    return;
  }

  store.checking = true;
  store.lastCheckAt = now;

  if (!store.initialized && store.unlocked.length === 0) {
    store.loading = true;
    emitChange();
  }

  try {
    const existing = await loadUnlockedAchievements().catch(
      () => store.unlocked,
    );

    store.unlocked = existing;
    store.loading = false;
    emitChange();

    const checkData = await buildCheckData();
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

    const updated = await loadUnlockedAchievements().catch(() => {
      if (newlyEarned.length === 0) return store.unlocked;

      const merged = [...store.unlocked];
      for (const achievement of newlyEarned) {
        if (!merged.some((item) => item.id === achievement.id)) {
          merged.push(achievement);
        }
      }
      return merged;
    });

    store.unlocked = updated;

    if (newlyEarned.length > 0) {
      store.newlyUnlocked = [...store.newlyUnlocked, ...newlyEarned];
    }
  } finally {
    store.checking = false;
    store.loading = false;
    store.initialized = true;
    emitChange();
  }
}

function bindEventsOnce() {
  if (store.eventsBound || typeof window === 'undefined') return;
  store.eventsBound = true;

  const handleActivity = () => {
    void runCheck();
  };

  [
    'fitness:changed',
    'nutrition:changed',
    'todos:changed',
    'schedule:changed',
    'daily-life:reading:changed',
    'goal_module:changed',
    ACHIEVEMENTS_CHANGED_EVENT,
  ].forEach((eventName) => {
    window.addEventListener(eventName, handleActivity);
  });
}

export function useAchievements(): UseAchievementsResult {
  const [, setVersion] = useState(0);

  useEffect(() => {
    bindEventsOnce();

    const unsubscribe = subscribe(() => {
      setVersion((v) => v + 1);
    });

    void runCheck();

    return unsubscribe;
  }, []);

  return {
    unlocked: store.unlocked,
    newlyUnlocked: store.newlyUnlocked,
    dismissNew,
    loading: store.loading,
  };
}