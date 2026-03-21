import { useEffect, useMemo, useState } from "react";
import {
  getDailyRoutine,
  getRoutineItems,
  getRoutineStreak,
  seedDailyRoutine,
  seedRoutineItems,
  seedRoutineStreak,
  todayISO,
  type DailyRoutineState,
  type RoutineStreakState,
} from "@/features/goals/modules/skincare/skincareStorage";
import { GOAL_MODULE_CHANGED_EVENT } from "@/features/goals/modules/goalModuleStorage";

const SKINCARE_GOAL_ID = "skincare";

type RoutineItemsState = ReturnType<typeof seedRoutineItems>;

export function useSkincareDashboard(goalId = SKINCARE_GOAL_ID) {
  const [streak, setStreak] = useState<RoutineStreakState>(() =>
    seedRoutineStreak(goalId),
  );
  const [daily, setDaily] = useState<DailyRoutineState>(() =>
    seedDailyRoutine(goalId),
  );
  const [items, setItems] = useState<RoutineItemsState>(() =>
    seedRoutineItems(goalId),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const [nextStreak, nextDaily, nextItems] = await Promise.all([
          getRoutineStreak(goalId),
          getDailyRoutine(goalId),
          getRoutineItems(goalId),
        ]);

        if (cancelled) return;

        setStreak(nextStreak);
        setDaily(nextDaily);
        setItems(nextItems);
      } catch (error) {
        console.warn("skincare dashboard load failed", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetch();

    const sync = () => {
      void fetch();
    };

    window.addEventListener(GOAL_MODULE_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      cancelled = true;
      window.removeEventListener(GOAL_MODULE_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [goalId]);

  const summary = useMemo(() => {
    const completedItems =
      Object.values(items.items.am).filter(Boolean).length +
      Object.values(items.items.pm).filter(Boolean).length;
    const completedSessions = Number(daily.amDone) + Number(daily.pmDone);
    const completedToday = completedItems + completedSessions;
    const today = todayISO();
    const didCompleteToday = streak.lastISO === today;

    return {
      streakDays: streak.streak,
      completedToday,
      amDone: daily.amDone,
      pmDone: daily.pmDone,
      didCompleteToday,
      todaysDate: daily.dayISO,
    };
  }, [daily, items, streak.lastISO, streak.streak]);

  return { summary, loading };
}
