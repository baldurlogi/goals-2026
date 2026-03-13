import { useEffect, useState } from 'react';
import {
  bindAchievementEventsOnce,
  dismissAchievementModal,
  getAchievementStore,
  runAchievementCheck,
  subscribeAchievements,
  type UseAchievementsResult,
} from './achievementEngine';

export type { UseAchievementsResult } from './achievementEngine';

export function useAchievements(): UseAchievementsResult {
  const [, setVersion] = useState(0);

  useEffect(() => {
    bindAchievementEventsOnce();

    const unsubscribe = subscribeAchievements(() => {
      setVersion((v) => v + 1);
    });

    void runAchievementCheck();

    return unsubscribe;
  }, []);

  const snapshot = getAchievementStore();

  return {
    unlocked: snapshot.unlocked,
    newlyUnlocked: snapshot.newlyUnlocked,
    dismissNew: dismissAchievementModal,
    loading: snapshot.loading,
  };
}
