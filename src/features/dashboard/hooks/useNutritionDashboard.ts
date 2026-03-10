import { useEffect, useMemo, useState } from 'react';
import {
  loadNutritionLog,
  loadPhase,
  getLoggedMacros,
  NUTRITION_CHANGED_EVENT,
  type NutritionLog,
} from '@/features/nutrition/nutritionStorage';
import {
  getTargets,
  type NutritionPhase,
} from '@/features/nutrition/nutritionData';
import { useTodayDate } from '@/hooks/useTodayDate';
import { getLocalDateKey } from '@/hooks/useTodayDate';
import { PROFILE_CHANGED_EVENT } from '@/features/onboarding/profileStorage';

const LOG_CACHE = 'cache:nutrition_log:v1';
const PHASE_CACHE = 'cache:nutrition_phase:v1';

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(Math.max(v, lo), hi);
}
function pct(value: number, target: number) {
  return clamp(target > 0 ? Math.round((value / target) * 100) : 0);
}

function readLogCache(today = getLocalDateKey()): NutritionLog {
  try {
    const raw = localStorage.getItem(LOG_CACHE);
    if (!raw) return { date: today, eaten: {}, customEntries: [] };
    const parsed = JSON.parse(raw) as NutritionLog;
    // stale day — return empty
    if (parsed.date !== today)
      return { date: today, eaten: {}, customEntries: [] };
    return parsed;
  } catch {
    return {
      date: getLocalDateKey(),
      eaten: {},
      customEntries: [],
    };
  }
}

function readPhaseCache(): NutritionPhase {
  return (
    (localStorage.getItem(PHASE_CACHE) as NutritionPhase | null) ?? 'maintain'
  );
}

export function useNutritionDashboard() {
  const today = useTodayDate();
  const [log, setLog] = useState<NutritionLog>(() => readLogCache(today));
  const [phase, setPhase] = useState<NutritionPhase>(readPhaseCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const [freshLog, freshPhase] = await Promise.all([
        loadNutritionLog(),
        loadPhase(),
      ]);
      if (!cancelled) {
        setLog(freshLog);
        setPhase(freshPhase);
        setLoading(false);
        try {
          localStorage.setItem(LOG_CACHE, JSON.stringify(freshLog));
          localStorage.setItem(PHASE_CACHE, freshPhase);
        } catch (e) {
          console.warn('read cache failed', e);
          return {};
        }
      }
    }

    fetch();

    const sync = () => fetch();
    window.addEventListener(NUTRITION_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      cancelled = true;
      window.removeEventListener(NUTRITION_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Re-read targets whenever user saves new profile macros
  const [profileVersion, setProfileVersion] = useState(0);
  useEffect(() => {
    const bump = () => setProfileVersion((v) => v + 1);
    window.addEventListener(PROFILE_CHANGED_EVENT, bump);
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, bump);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const target = useMemo(() => getTargets(phase), [phase, profileVersion]);
  const logged = useMemo(() => getLoggedMacros(log), [log]);
  const calPct = pct(logged.cal, target.cal);

  const presetMealsEaten = Object.values(log.eaten).filter(Boolean).length;
  const customCount = (log.customEntries ?? []).length;
  const itemsLogged = presetMealsEaten + customCount;
  const caloriesRemaining = target.cal - logged.cal;
  const proteinRemaining = target.protein - logged.protein;

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