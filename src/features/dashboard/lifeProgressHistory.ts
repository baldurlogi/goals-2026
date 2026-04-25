import { useEffect, useMemo, useState } from "react";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import {
  getActiveUserId,
  getScopedStorageItem,
  scopedKey,
  writeScopedStorageItem,
} from "@/lib/activeUser";

export const LIFE_PROGRESS_HISTORY_CHANGED_EVENT = "life-progress-history:changed";

const MAX_HISTORY_DAYS = 120;

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

export function seedLifeProgressHistory(
  userId: string | null = getActiveUserId(),
): LifeProgressHistoryEntry[] {
  try {
    const raw = getScopedStorageItem(CACHE_KEYS.LIFE_PROGRESS_HISTORY, userId);
    return raw ? normalizeHistory(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
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

  try {
    const key = scopedKey(CACHE_KEYS.LIFE_PROGRESS_HISTORY, userId);
    assertRegisteredCacheWrite(key);
    writeScopedStorageItem(
      CACHE_KEYS.LIFE_PROGRESS_HISTORY,
      userId,
      JSON.stringify(
        nextHistory
          .sort((left, right) => left.date.localeCompare(right.date))
          .slice(-MAX_HISTORY_DAYS),
      ),
    );
    emitHistoryChanged();
  } catch {
    // ignore storage failures
  }
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
  const [history, setHistory] = useState<LifeProgressHistoryEntry[]>(() =>
    seedLifeProgressHistory(),
  );

  useEffect(() => {
    const sync = () => {
      setHistory(seedLifeProgressHistory());
    };

    sync();
    window.addEventListener(LIFE_PROGRESS_HISTORY_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener(LIFE_PROGRESS_HISTORY_CHANGED_EVENT, sync);
    };
  }, []);

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
