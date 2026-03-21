import { useEffect, useMemo, useState } from "react";
import {
  countCompletedRoutineSections,
  countCompletedRoutineSteps,
  countRoutineSteps,
  getRoutineItems,
  getRoutineTemplate,
  getRoutineStreak,
  isRoutineSectionComplete,
  seedRoutineItems,
  seedRoutineTemplate,
  seedRoutineStreak,
  todayISO,
  type RoutineItemsState,
  type RoutineTemplateState,
  type RoutineStreakState,
} from "@/features/goals/modules/skincare/skincareStorage";
import { GOAL_MODULE_CHANGED_EVENT } from "@/features/goals/modules/goalModuleStorage";

const SKINCARE_GOAL_ID = "skincare";

export function useSkincareDashboard(goalId = SKINCARE_GOAL_ID) {
  const seededRoutine = seedRoutineTemplate(goalId);
  const [streak, setStreak] = useState<RoutineStreakState>(() =>
    seedRoutineStreak(goalId),
  );
  const [routine, setRoutine] = useState<RoutineTemplateState>(() =>
    seededRoutine,
  );
  const [items, setItems] = useState<RoutineItemsState>(() =>
    seedRoutineItems(goalId, seededRoutine),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const [nextStreak, nextRoutine] = await Promise.all([
          getRoutineStreak(goalId),
          getRoutineTemplate(goalId),
        ]);
        const nextItems = await getRoutineItems(goalId, nextRoutine);

        if (cancelled) return;

        setStreak(nextStreak);
        setRoutine(nextRoutine);
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
    const completedToday = countCompletedRoutineSteps(routine, items);
    const totalSteps = countRoutineSteps(routine);
    const completedRoutines = countCompletedRoutineSections(routine, items);
    const activeRoutines =
      Number(routine.am.length > 0) + Number(routine.pm.length > 0);
    const today = todayISO();
    const didCompleteToday = streak.lastISO === today;

    return {
      streakDays: streak.streak,
      completedToday,
      totalSteps,
      completedRoutines,
      activeRoutines,
      amDone: isRoutineSectionComplete("am", routine, items),
      pmDone: isRoutineSectionComplete("pm", routine, items),
      didCompleteToday,
      todaysDate: items.dayISO,
    };
  }, [items, routine, streak.lastISO, streak.streak]);

  return { summary, loading };
}
