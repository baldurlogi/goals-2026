import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/authContext";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import {
  getActiveUserId,
  getScopedStorageItem,
  legacyScopedKey,
  scopedKey,
  writeScopedStorageItem,
} from "@/lib/activeUser";
import { supabase } from "@/lib/supabaseClient";

export const LIFE_PROGRESS_HISTORY_CHANGED_EVENT = "life-progress-history:changed";

const MAX_HISTORY_DAYS = 120;
const LIFE_PROGRESS_HISTORY_TABLE = "life_progress_history";

export type LifeProgressHistoryEntry = {
  date: string;
  score: number;
};

export type LifeProgressRangePoint = {
  date: string;
  label: string;
  score: number | null;
};

export type LifeProgressChartPoint = LifeProgressRangePoint & {
  axisKey: string;
  synthetic?: boolean;
};

function emitHistoryChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LIFE_PROGRESS_HISTORY_CHANGED_EVENT));
  }
}

function normalizeScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function isValidDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeHistory(input: unknown): LifeProgressHistoryEntry[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const record = entry as Partial<LifeProgressHistoryEntry>;
      return {
        date: isValidDateKey(record.date) ? record.date : getLocalDateKey(),
        score: normalizeScore(Number(record.score ?? 0)),
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-MAX_HISTORY_DAYS);
}

function writeLifeProgressHistoryCache(
  userId: string | null,
  entries: LifeProgressHistoryEntry[],
) {
  if (!userId) return;

  try {
    const key = scopedKey(CACHE_KEYS.LIFE_PROGRESS_HISTORY, userId);
    assertRegisteredCacheWrite(key);
    writeScopedStorageItem(
      CACHE_KEYS.LIFE_PROGRESS_HISTORY,
      userId,
      JSON.stringify(normalizeHistory(entries)),
    );
  } catch {
    // ignore storage failures
  }
}

function mergeHistory(
  serverEntries: LifeProgressHistoryEntry[],
  localEntries: LifeProgressHistoryEntry[],
): LifeProgressHistoryEntry[] {
  const byDate = new Map<string, LifeProgressHistoryEntry>();

  for (const entry of localEntries) {
    byDate.set(entry.date, entry);
  }

  for (const entry of serverEntries) {
    byDate.set(entry.date, entry);
  }

  return normalizeHistory([...byDate.values()]);
}

function readLegacyLifeProgressHistory(
  userId: string | null,
): LifeProgressHistoryEntry[] {
  if (!userId || typeof window === "undefined") return [];

  try {
    const storage = window.localStorage;
    const relatedKeys = new Set<string>([
      CACHE_KEYS.LIFE_PROGRESS_HISTORY,
      legacyScopedKey(CACHE_KEYS.LIFE_PROGRESS_HISTORY, userId),
      scopedKey(CACHE_KEYS.LIFE_PROGRESS_HISTORY, userId),
    ]);

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      if (!key.startsWith(`${CACHE_KEYS.LIFE_PROGRESS_HISTORY}:`)) continue;
      if (!key.endsWith(userId)) continue;
      relatedKeys.add(key);
    }

    const merged = normalizeHistory(
      [...relatedKeys].flatMap((key) => {
        try {
          const raw = storage.getItem(key);
          return raw ? (JSON.parse(raw) as unknown[]) : [];
        } catch {
          return [];
        }
      }),
    );

    if (merged.length > 0) {
      writeLifeProgressHistoryCache(userId, merged);
    }

    return merged;
  } catch {
    return [];
  }
}

export function seedLifeProgressHistory(
  userId: string | null = getActiveUserId(),
): LifeProgressHistoryEntry[] {
  try {
    const raw = getScopedStorageItem(CACHE_KEYS.LIFE_PROGRESS_HISTORY, userId);
    if (raw) return normalizeHistory(JSON.parse(raw));
    return readLegacyLifeProgressHistory(userId);
  } catch {
    return readLegacyLifeProgressHistory(userId);
  }
}

async function syncLifeProgressHistoryToServer(
  userId: string,
  entries: LifeProgressHistoryEntry[],
) {
  if (entries.length === 0) return;

  const { error } = await supabase.from(LIFE_PROGRESS_HISTORY_TABLE).upsert(
    entries.map((entry) => ({
      user_id: userId,
      snapshot_date: entry.date,
      score: entry.score,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "user_id,snapshot_date" },
  );

  if (error) {
    console.warn("syncLifeProgressHistoryToServer error:", error);
  }
}

export async function loadLifeProgressHistory(
  userId: string | null = getActiveUserId(),
): Promise<LifeProgressHistoryEntry[]> {
  if (!userId) return [];

  const seeded = seedLifeProgressHistory(userId);

  const { data, error } = await supabase
    .from(LIFE_PROGRESS_HISTORY_TABLE)
    .select("snapshot_date, score")
    .eq("user_id", userId)
    .order("snapshot_date", { ascending: true })
    .limit(MAX_HISTORY_DAYS);

  if (error) {
    console.warn("loadLifeProgressHistory error:", error);
    return seeded;
  }

  const serverEntries = normalizeHistory(
    (data ?? []).map((entry) => {
      const row = entry as { snapshot_date?: string | null; score?: number | null };
      return {
        date: row.snapshot_date ?? getLocalDateKey(),
        score: row.score ?? 0,
      };
    }),
  );

  const serverDates = new Set(serverEntries.map((entry) => entry.date));
  const localOnlyEntries = seeded.filter((entry) => !serverDates.has(entry.date));

  if (localOnlyEntries.length > 0) {
    await syncLifeProgressHistoryToServer(userId, localOnlyEntries);
  }

  const merged = mergeHistory(serverEntries, seeded);
  writeLifeProgressHistoryCache(userId, merged);
  return merged;
}

export function saveLifeProgressSnapshot(
  userId: string | null,
  snapshot: LifeProgressHistoryEntry,
) {
  if (!userId) return;

  const nextEntry = {
    date: isValidDateKey(snapshot.date) ? snapshot.date : getLocalDateKey(),
    score: normalizeScore(snapshot.score),
  };

  const nextHistory = seedLifeProgressHistory(userId).filter(
    (entry) => entry.date !== nextEntry.date,
  );
  nextHistory.push(nextEntry);

  writeLifeProgressHistoryCache(userId, nextHistory);
  emitHistoryChanged();
  void syncLifeProgressHistoryToServer(userId, [nextEntry]);
}

export function buildLifeProgressRange(
  history: LifeProgressHistoryEntry[],
  days: number,
): LifeProgressRangePoint[] {
  const today = new Date(`${getLocalDateKey()}T00:00:00`);
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - (days - 1));
  const byDate = new Map(history.map((entry) => [entry.date, entry.score]));
  const visibleHistory = history.filter((entry) => entry.date >= getDateKey(windowStart));
  const firstVisibleDate = visibleHistory[0]?.date ?? getLocalDateKey();
  const startDate = new Date(`${firstVisibleDate}T00:00:00`);

  const totalDays = Math.max(
    1,
    Math.floor((today.getTime() - startDate.getTime()) / 86_400_000) + 1,
  );

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const iso = getDateKey(date);

    return {
      date: iso,
      score: byDate.get(iso) ?? null,
      label: days <= 7
        ? date.toLocaleDateString(undefined, { weekday: "short" })
        : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
  });
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function useLifeProgressHistory(days: number) {
  const { userId, authReady } = useAuth();
  const [history, setHistory] = useState<LifeProgressHistoryEntry[]>(() =>
    seedLifeProgressHistory(userId),
  );

  useEffect(() => {
    const sync = () => {
      setHistory(seedLifeProgressHistory(userId));
    };

    sync();

    if (!authReady) return;

    if (!userId) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    const refresh = () => {
      void loadLifeProgressHistory(userId).then((nextHistory) => {
        if (cancelled) return;
        setHistory(nextHistory);
      });
    };

    refresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    const interval = window.setInterval(refresh, 30_000);

    window.addEventListener(LIFE_PROGRESS_HISTORY_CHANGED_EVENT, sync);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener(LIFE_PROGRESS_HISTORY_CHANGED_EVENT, sync);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authReady, userId]);

  return useMemo(() => buildLifeProgressRange(history, days), [days, history]);
}

export function buildLifeProgressChartSeries(
  points: LifeProgressRangePoint[],
): LifeProgressChartPoint[] {
  const basePoints = points.map((point) => ({
    ...point,
    axisKey: point.date,
  }));

  if (points.length !== 1 || points[0]?.score == null) {
    return basePoints;
  }

  const onlyPoint = basePoints[0];

  return [
    { ...onlyPoint, axisKey: `${onlyPoint.date}:left`, label: "", synthetic: true },
    onlyPoint,
    { ...onlyPoint, axisKey: `${onlyPoint.date}:right`, label: "", synthetic: true },
  ];
}
