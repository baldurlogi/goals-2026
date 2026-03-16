import { supabase } from "@/lib/supabaseClient";
import { DAY_KEYS, DEFAULT_SPLIT_LABELS, FITNESS_CHANGED_EVENT } from "./constants";
import { diffDays, todayISO, yesterdayISO } from "./date";
import type { DayKey, DaySplit, WeeklySplitConfig } from "./types";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";

const SPLIT_CACHE_KEY = CACHE_KEYS.FITNESS_SPLIT;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FITNESS_CHANGED_EVENT));
  }
}

function normalizeWeeklySplit(cfg: WeeklySplitConfig): WeeklySplitConfig {
  const next = { ...cfg, days: { ...cfg.days } };

  for (const dk of DAY_KEYS) {
    if (!next.days[dk]) {
      next.days[dk] = {
        label: DEFAULT_SPLIT_LABELS[dk],
        completedDate: null,
      };
    }
  }

  return next;
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

export function readSplitCache(): WeeklySplitConfig {
  try {
    const raw = localStorage.getItem(SPLIT_CACHE_KEY);
    if (!raw) return makeDefaultSplit();

    return normalizeWeeklySplit(JSON.parse(raw) as WeeklySplitConfig);
  } catch {
    return makeDefaultSplit();
  }
}

function writeSplitCache(cfg: WeeklySplitConfig): void {
  try {
    assertRegisteredCacheWrite(SPLIT_CACHE_KEY);
    localStorage.setItem(SPLIT_CACHE_KEY, JSON.stringify(cfg));
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
  const today = todayISO();
  const isToday = day === todayDayKey();
  const wasCompleted = cfg.days[day].completedDate === today;

  const updatedDays: Record<DayKey, DaySplit> = {
    ...cfg.days,
    [day]: {
      ...cfg.days[day],
      completedDate: wasCompleted ? null : today,
    },
  };

  let { streak, lastStreakDate } = cfg;

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
  const next: WeeklySplitConfig = {
    ...cfg,
    days: {
      ...cfg.days,
      [day]: {
        ...cfg.days[day],
        label,
      },
    },
  };

  await saveWeeklySplit(next);
  return next;
}