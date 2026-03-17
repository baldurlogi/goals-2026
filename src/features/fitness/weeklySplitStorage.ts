import { supabase } from "@/lib/supabaseClient";
import {
  DAY_KEYS,
  DEFAULT_SPLIT_LABELS,
  FITNESS_CHANGED_EVENT,
} from "./constants";
import {
  diffDays,
  isISOInCurrentWeek,
  todayISO,
  yesterdayISO,
} from "./date";
import type { DayKey, DaySplit, WeeklySplitConfig } from "./types";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import { getActiveUserId, scopedKey } from "@/lib/activeUser";

const SPLIT_CACHE_KEY = CACHE_KEYS.FITNESS_SPLIT;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FITNESS_CHANGED_EVENT));
  }
}

function normalizeCompletedDate(completedDate: string | null): string | null {
  if (!completedDate) return null;
  return isISOInCurrentWeek(completedDate) ? completedDate : null;
}

function normalizeWeeklySplit(cfg: WeeklySplitConfig): WeeklySplitConfig {
  const next = { ...cfg, days: { ...cfg.days } };

  for (const dk of DAY_KEYS) {
    const existing = next.days[dk];

    next.days[dk] = {
      label: existing?.label ?? DEFAULT_SPLIT_LABELS[dk],
      completedDate: normalizeCompletedDate(existing?.completedDate ?? null),
    };
  }

  return {
    days: next.days,
    streak: typeof next.streak === "number" ? next.streak : 0,
    lastStreakDate: next.lastStreakDate ?? null,
  };
}

export function makeDefaultSplit(): WeeklySplitConfig {
  const days = {} as Record<DayKey, DaySplit>;

  for (const dk of DAY_KEYS) {
    days[dk] = { label: DEFAULT_SPLIT_LABELS[dk], completedDate: null };
  }

  return { days, streak: 0, lastStreakDate: null };
}

export function todayDayKey(): DayKey {
  const map: DayKey[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[new Date().getDay()];
}

function splitCacheKey(userId: string | null = getActiveUserId()) {
  return scopedKey(SPLIT_CACHE_KEY, userId);
}

export function readSplitCache(userId: string | null = getActiveUserId()): WeeklySplitConfig {
  try {
    const raw = localStorage.getItem(splitCacheKey(userId));
    if (!raw) return makeDefaultSplit();

    return normalizeWeeklySplit(JSON.parse(raw) as WeeklySplitConfig);
  } catch {
    return makeDefaultSplit();
  }
}

function writeSplitCache(cfg: WeeklySplitConfig, userId: string | null = getActiveUserId()): void {
  try {
    const key = splitCacheKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

export async function loadWeeklySplit(): Promise<WeeklySplitConfig> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return readSplitCache();

  const { data, error } = await supabase
    .from("fitness_weekly_split")
    .select("config")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("loadWeeklySplit error:", error);
    return readSplitCache();
  }

  if (data?.config) {
    const cfg = normalizeWeeklySplit(data.config as WeeklySplitConfig);
    writeSplitCache(cfg);
    return cfg;
  }

  return readSplitCache();
}

export async function saveWeeklySplit(cfg: WeeklySplitConfig): Promise<void> {
  const normalized = normalizeWeeklySplit(cfg);
  writeSplitCache(normalized);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    emit();
    return;
  }

  const { error } = await supabase
    .from("fitness_weekly_split")
    .upsert({ user_id: user.id, config: normalized }, { onConflict: "user_id" });

  if (error) {
    console.warn("saveWeeklySplit error:", error);
    return;
  }

  emit();
}

export async function toggleDayCompletion(
  cfg: WeeklySplitConfig,
  day: DayKey,
): Promise<WeeklySplitConfig> {
  const normalizedCfg = normalizeWeeklySplit(cfg);
  const today = todayISO();
  const isToday = day === todayDayKey();
  const wasCompleted = normalizedCfg.days[day].completedDate === today;

  const updatedDays: Record<DayKey, DaySplit> = {
    ...normalizedCfg.days,
    [day]: {
      ...normalizedCfg.days[day],
      completedDate: wasCompleted ? null : today,
    },
  };

  let { streak, lastStreakDate } = normalizedCfg;

  if (isToday) {
    if (!wasCompleted) {
      if (!lastStreakDate) {
        streak = 1;
      } else {
        const delta = diffDays(lastStreakDate, today);
        if (delta === 1) streak += 1;
        else if (delta !== 0) streak = 1;
      }
      lastStreakDate = today;
    } else if (lastStreakDate === today) {
      streak = Math.max(0, streak - 1);
      lastStreakDate = streak === 0 ? null : yesterdayISO();
    }
  }

  const next: WeeklySplitConfig = {
    days: updatedDays,
    streak,
    lastStreakDate,
  };

  await saveWeeklySplit(next);
  return next;
}

export async function updateDayLabel(
  cfg: WeeklySplitConfig,
  day: DayKey,
  label: string,
): Promise<WeeklySplitConfig> {
  const normalizedCfg = normalizeWeeklySplit(cfg);

  const next: WeeklySplitConfig = {
    ...normalizedCfg,
    days: {
      ...normalizedCfg.days,
      [day]: {
        ...normalizedCfg.days[day],
        label,
      },
    },
  };

  await saveWeeklySplit(next);
  return next;
}