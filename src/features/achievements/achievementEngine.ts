import { ACHIEVEMENTS } from './achievementList';
import {
  loadUnlockedAchievements,
  seedAchievements,
  unlockAchievement,
  ACHIEVEMENTS_CHANGED_EVENT,
} from './achievementStorage';
import { buildAchievementCheckData } from "./achievementAdapters";
import type { UnlockedAchievement } from './achievementTypes';
import { getLocalDateKey } from '@/hooks/useTodayDate';

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

export function subscribeAchievements(listener: Listener) {
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

export function dismissAchievementModal() {
  if (store.newlyUnlocked.length === 0) return;
  store.newlyUnlocked = store.newlyUnlocked.slice(1);
  emitChange();
}

export function getAchievementStore(): UseAchievementsResult {
  return {
    unlocked: store.unlocked,
    newlyUnlocked: store.newlyUnlocked,
    dismissNew: dismissAchievementModal,
    loading: store.loading,
  };
}

export async function runAchievementCheck(force = false) {
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
    const existing = await loadUnlockedAchievements().catch(() => store.unlocked);

    store.unlocked = existing;
    store.loading = false;
    emitChange();

    const checkData = await buildAchievementCheckData();
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

export function bindAchievementEventsOnce() {
  if (store.eventsBound || typeof window === 'undefined') return;
  store.eventsBound = true;

  const handleActivity = () => {
    void runAchievementCheck();
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
