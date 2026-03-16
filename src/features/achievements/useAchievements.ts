import { useEffect, useState } from "react";
import {
  bindAchievementEventsOnce,
  dismissAchievementModal,
  getAchievementStore,
  runAchievementCheck,
  subscribeAchievements,
  type UseAchievementsResult,
} from "./achievementEngine";

export type { UseAchievementsResult } from "./achievementEngine";

function scheduleIdle(callback: () => void) {
  const w = window as Window & {
    requestIdleCallback?: (
      cb: () => void,
      options?: { timeout: number }
    ) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(callback, { timeout: 1200 });
    return () => {
      if (typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(id);
      }
    };
  }

  const timeoutId = window.setTimeout(callback, 150);
  return () => window.clearTimeout(timeoutId);
}

export function useAchievements(): UseAchievementsResult {
  const [, setVersion] = useState(0);

  useEffect(() => {
    bindAchievementEventsOnce();

    const unsubscribe = subscribeAchievements(() => {
      setVersion((v) => v + 1);
    });

    const cancelIdleCheck = scheduleIdle(() => {
      void runAchievementCheck();
    });

    return () => {
      cancelIdleCheck();
      unsubscribe();
    };
  }, []);

  const snapshot = getAchievementStore();

  return {
    unlocked: snapshot.unlocked,
    newlyUnlocked: snapshot.newlyUnlocked,
    dismissNew: dismissAchievementModal,
    loading: snapshot.loading,
  };
}