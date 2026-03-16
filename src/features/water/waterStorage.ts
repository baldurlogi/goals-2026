import { getLocalDateKey } from '@/hooks/useTodayDate';
import { supabase } from '@/lib/supabaseClient';
import { cacheKeyBuilders, assertRegisteredCacheWrite } from '@/lib/cacheRegistry';

export const WATER_CHANGED_EVENT = 'water:changed';

export type WaterLog = {
  date: string;
  ml: number;
  targetMl: number;
};

function emit() {
  window.dispatchEvent(new Event(WATER_CHANGED_EVENT));
}

export function todayKey() {
  return getLocalDateKey();
}

export function defaultWaterLog(date = todayKey()): WaterLog {
  return {
    date,
    ml: 0,
    targetMl: 2500,
  };
}

function cacheKey(date: string) {
  return cacheKeyBuilders.water(date);
}

function normalizeWaterLog(
  input: Partial<WaterLog> | null | undefined,
  date = todayKey(),
): WaterLog {
  return {
    date: input?.date ?? date,
    ml: Math.max(0, Math.round(Number(input?.ml ?? 0) || 0)),
    targetMl: Math.max(
      250,
      Math.round(Number(input?.targetMl ?? 2500) || 2500),
    ),
  };
}

export function readWaterCache(date = todayKey()): WaterLog | null {
  try {
    const raw = localStorage.getItem(cacheKey(date));
    if (!raw) return null;
    return normalizeWaterLog(JSON.parse(raw) as Partial<WaterLog>, date);
  } catch {
    return null;
  }
}

function writeWaterCache(log: WaterLog): void {
  try {
    const key = cacheKey(log.date);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(log));
  } catch {
    return;
  }
}

export async function loadWaterLog(date = todayKey()): Promise<WaterLog> {
  const cached = readWaterCache(date);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return cached ?? defaultWaterLog(date);
  }

  const { data, error } = await supabase
    .from('water_logs')
    .select('log_date, ml, target_ml')
    .eq('user_id', user.id)
    .eq('log_date', date)
    .maybeSingle();

  if (error) {
    console.warn('loadWaterLog error:', error);
    return cached ?? defaultWaterLog(date);
  }

  if (!data) {
    return cached ?? defaultWaterLog(date);
  }

  const normalized = normalizeWaterLog(
    {
      date: data.log_date as string,
      ml: data.ml as number,
      targetMl: data.target_ml as number,
    },
    date,
  );

  writeWaterCache(normalized);
  return normalized;
}

export async function saveWaterLog(log: WaterLog): Promise<void> {
  const normalized = normalizeWaterLog(log, log.date);
  writeWaterCache(normalized);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    emit();
    return;
  }

  const { error } = await supabase.from('water_logs').upsert(
    {
      user_id: user.id,
      log_date: normalized.date,
      ml: normalized.ml,
      target_ml: normalized.targetMl,
    },
    { onConflict: 'user_id,log_date' },
  );

  if (error) {
    console.warn('saveWaterLog error:', error);
  }

  emit();
}

export async function addWater(
  amountMl: number,
  date = todayKey(),
): Promise<void> {
  const current = await loadWaterLog(date);
  await saveWaterLog({
    ...current,
    ml: Math.max(0, current.ml + Math.round(amountMl)),
  });
}

export async function resetWaterLog(date = todayKey()): Promise<void> {
  const current = await loadWaterLog(date);
  await saveWaterLog({
    ...current,
    ml: 0,
  });
}

export async function setWaterTarget(
  targetMl: number,
  date = todayKey(),
): Promise<void> {
  const current = await loadWaterLog(date);
  await saveWaterLog({
    ...current,
    targetMl: Math.max(250, Math.round(targetMl)),
  });
}
