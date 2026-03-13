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
    if (parsed.date !== today) {
      return { date: today, eaten: {}, customEntries: [] };
    }

    return parsed;
  } catch {
    return {
      date: today,
      eaten: {},
      customEntries: [],
    };
  }
}

function hasTodayLogCache(today = getLocalDateKey()): boolean {
  try {
    const raw = localStorage.getItem(LOG_CACHE);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as NutritionLog;
    return parsed.date === today;
  } catch {
    return false;
  }
}

function readPhaseCache(): NutritionPhase {
  try {
    const raw = localStorage.getItem(PHASE_CACHE);
    return raw === 'cut' || raw === 'maintain' ? raw : 'maintain';
  } catch {
    return 'maintain';
  }
}

function hasPhaseCache(): boolean {
  try {
    const raw = localStorage.getItem(PHASE_CACHE);
    return raw === 'cut' || raw === 'maintain';
  } catch {
    return false;
  }
}

export function useNutritionDashboard() {
  const today = useTodayDate();

  const [log, setLog] = useState<NutritionLog>(() => readLogCache(today));
  const [phase, setPhase] = useState<NutritionPhase>(readPhaseCache);
  const [loading, setLoading] = useState(
    () => !(hasTodayLogCache(today) || hasPhaseCache()),
  );

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const [freshLog, freshPhase] = await Promise.all([
          loadNutritionLog(),
          loadPhase(),
        ]);

        if (!cancelled) {
          setLog(freshLog);
          setPhase(freshPhase);

          try {
            localStorage.setItem(LOG_CACHE, JSON.stringify(freshLog));
            localStorage.setItem(PHASE_CACHE, freshPhase);
          } catch (e) {
            console.warn('nutrition cache write failed', e);
          }
        }
      } catch (e) {
        console.warn('nutrition dashboard load failed', e);
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

    window.addEventListener(NUTRITION_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);

    return () => {
      cancelled = true;
      window.removeEventListener(NUTRITION_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(() => {
    const bump = () => setProfileVersion((v) => v + 1);
    window.addEventListener(PROFILE_CHANGED_EVENT, bump);
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, bump);
  }, []);

  const target = useMemo(() => getTargets(phase), [phase, profileVersion]);
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