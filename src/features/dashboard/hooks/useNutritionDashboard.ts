import { useCallback, useMemo, useState } from 'react';
import {
  loadNutritionLog,
  loadPhase,
  getLoggedMacros,
  NUTRITION_CHANGED_EVENT,
  NUTRITION_LOG_CACHE_KEY,
  NUTRITION_PHASE_CACHE_KEY,
  type NutritionLog,
} from '@/features/nutrition/nutritionStorage';
import {
  getTargets,
  type NutritionPhase,
} from '@/features/nutrition/nutritionData';
import { useTodayDate } from '@/hooks/useTodayDate';
import { useProfile } from '@/features/onboarding/useProfile';
import {
  hasDateAwareCache,
  readDateAwareCache,
  readStringCache,
  writeDateAwareCache,
  writeStringCache,
} from '@/lib/cache';
import { useDashboardLoadSubscription } from '@/features/dashboard/hooks/useDashboardLoadSubscription';

const EMPTY_LOG: NutritionLog = { date: '', eaten: {}, customEntries: [] };
const PHASE_EVENTS = [NUTRITION_CHANGED_EVENT] as const;
const NUTRITION_STORAGE_KEYS = [
  NUTRITION_LOG_CACHE_KEY,
  NUTRITION_PHASE_CACHE_KEY,
] as const;

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(Math.max(v, lo), hi);
}

function pct(value: number, target: number) {
  return clamp(target > 0 ? Math.round((value / target) * 100) : 0);
}

function normalizePhase(raw: string): NutritionPhase {
  return raw === 'cut' || raw === 'maintain' ? raw : 'maintain';
}

export function useNutritionDashboard() {
  const today = useTodayDate();
  const profile = useProfile();

  const [log, setLog] = useState<NutritionLog>(() =>
    readDateAwareCache(NUTRITION_LOG_CACHE_KEY, today, {
      ...EMPTY_LOG,
      date: today,
    }),
  );
  const [phase, setPhase] = useState<NutritionPhase>(() =>
    normalizePhase(readStringCache(NUTRITION_PHASE_CACHE_KEY, 'maintain')),
  );
  const [loading, setLoading] = useState(() => {
    const hasLog = hasDateAwareCache(NUTRITION_LOG_CACHE_KEY, today);
    const hasPhase = readStringCache(NUTRITION_PHASE_CACHE_KEY, '') !== '';
    return !(hasLog && hasPhase);
  });

  const load = useCallback(async () => {
    try {
      const [freshLog, freshPhase] = await Promise.all([
        loadNutritionLog(),
        loadPhase(),
      ]);

      setLog(freshLog);
      setPhase(freshPhase);
      writeDateAwareCache(NUTRITION_LOG_CACHE_KEY, freshLog);
      writeStringCache(NUTRITION_PHASE_CACHE_KEY, freshPhase);
    } catch (e) {
      console.warn('nutrition dashboard load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useDashboardLoadSubscription({
    load,
    events: PHASE_EVENTS,
    storageKeys: NUTRITION_STORAGE_KEYS,
  });

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
