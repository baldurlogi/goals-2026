import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadNutritionLog,
  loadPhase,
  getLoggedMacros,
  seedNutritionCache,
  NUTRITION_CHANGED_EVENT,
  type NutritionLog,
} from "@/features/nutrition/nutritionStorage";
import {
  getTargets,
  type NutritionPhase,
} from "@/features/nutrition/nutritionData";
import { useTodayDate } from "@/hooks/useTodayDate";
import { useProfile } from "@/features/onboarding/useProfile";
import { useAuth } from "@/features/auth/authContext";

const EMPTY_LOG: NutritionLog = { date: "", eaten: {}, customEntries: [] };

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(Math.max(v, lo), hi);
}

function pct(value: number, target: number) {
  return clamp(target > 0 ? Math.round((value / target) * 100) : 0);
}

function normalizePhase(raw: string): NutritionPhase {
  return raw === "cut" || raw === "maintain" ? raw : "maintain";
}

function ensureTodayLog(log: NutritionLog, today: string): NutritionLog {
  return {
    ...log,
    date: today,
  };
}

export function useNutritionDashboard() {
  const today = useTodayDate();
  const profile = useProfile();
  const { userId, authReady } = useAuth();

  const emptyLog = useMemo<NutritionLog>(
    () => ({ ...EMPTY_LOG, date: today }),
    [today],
  );

  const [log, setLog] = useState<NutritionLog>(() =>
    authReady && userId ? ensureTodayLog(seedNutritionCache(userId), today) : emptyLog,
  );
  const [phase, setPhase] = useState<NutritionPhase>("maintain");
  const [loading, setLoading] = useState(() =>
    authReady ? Boolean(userId) : true,
  );

  useEffect(() => {
    if (!authReady) {
      setLoading(true);
      return;
    }

    if (!userId) {
      setLog(emptyLog);
      setPhase("maintain");
      setLoading(false);
      return;
    }

    setLog(ensureTodayLog(seedNutritionCache(userId), today));
    setPhase("maintain");
    setLoading(true);
  }, [authReady, emptyLog, today, userId]);

  const load = useCallback(async () => {
    if (!authReady) return;

    if (!userId) {
      setLog(emptyLog);
      setPhase("maintain");
      setLoading(false);
      return;
    }

    try {
      const [freshLog, freshPhase] = await Promise.all([
        loadNutritionLog(userId),
        loadPhase(userId),
      ]);

      setLog(ensureTodayLog(freshLog, today));
      setPhase(normalizePhase(freshPhase));
    } catch (e) {
      console.warn("nutrition dashboard load failed", e);
    } finally {
      setLoading(false);
    }
  }, [authReady, emptyLog, today, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!authReady) return;

    const handleChange = () => {
      void load();
    };

    window.addEventListener(NUTRITION_CHANGED_EVENT, handleChange);

    return () => {
      window.removeEventListener(NUTRITION_CHANGED_EVENT, handleChange);
    };
  }, [authReady, load]);

  const target = useMemo(() => getTargets(phase, profile), [phase, profile]);
  const logged = useMemo(() => getLoggedMacros(log), [log]);
  const calPct = pct(logged.cal, target.cal);

  const presetMealsEaten = Object.values(log.eaten).filter(Boolean).length;
  const customCount = (log.customEntries ?? []).length;
  const itemsLogged = presetMealsEaten + customCount;
  const caloriesRemaining = target.cal - logged.cal;
  const proteinRemaining = Math.floor(target.protein - logged.protein);

  return {
    logged,
    target,
    phase,
    calPct,
    itemsLogged,
    presetMealsEaten,
    customCount,
    caloriesRemaining,
    proteinRemaining,
    loading,
  };
}