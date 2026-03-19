import type { ReadingInputs } from "./readingTypes";
import { supabase } from "@/lib/supabaseClient";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import {
  getActiveUserId,
  getScopedStorageItem,
  removeScopedStorageItem,
  scopedKey,
  writeScopedStorageItem,
} from "@/lib/activeUser";

const STORAGE_KEY = CACHE_KEYS.READING;
const READING_DAILY_PROGRESS_KEY = CACHE_KEYS.READING_DAILY_PROGRESS;
const AI_SIGNALS_CACHE_KEY = CACHE_KEYS.AI_SIGNALS;
const READING_HISTORY_KEY = CACHE_KEYS.READING_HISTORY;

function readingKey(userId: string | null = getActiveUserId()) {
  return scopedKey(STORAGE_KEY, userId);
}

function dailyProgressKey(userId: string | null = getActiveUserId()) {
  return scopedKey(READING_DAILY_PROGRESS_KEY, userId);
}

function readingHistoryKey(userId: string | null = getActiveUserId()) {
  return scopedKey(READING_HISTORY_KEY, userId);
}

export type ReadingHistoryEntry = {
  date: string;
  bookKey: string;
  title: string;
  author: string;
  totalPages: number;
  goalPages: number;
  baselinePage: number;
  latestPage: number;
  pagesRead: number;
  updatedAt: string;
};

export type WeeklyReadingSummary = {
  pagesRead: number;
  goalPages: number;
  daysRead: number;
  dataCompleteness: "complete" | "partial" | "unknown";
};

type ReadingDailyProgressCache = {
  date: string;
  bookKey: string;
  baselinePage: number;
  latestPage: number;
};

export type TodayReadingProgress = {
  hasBook: boolean;
  goalPages: number;
  pagesRead: number;
  pct: number;
};

function clearAISignalsCache(userId: string | null) {
  removeScopedStorageItem(AI_SIGNALS_CACHE_KEY, userId);
}

export const READING_CHANGED_EVENT = "daily-life:reading:changed";

function emitReadingChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(READING_CHANGED_EVENT));
  }
}

export const DEFAULT_READING_INPUTS: ReadingInputs = {
  current: { title: "", author: "", currentPage: "", totalPages: "" },
  upNext: [],
  completed: [],
  dailyGoalPages: "20",
  lastReadDate: null,
  streak: 0,
};

function parsePage(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseGoalPages(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getBookKey(inputs: ReadingInputs): string {
  const title = inputs.current.title.trim();
  const author = inputs.current.author.trim();
  const totalPages = String(inputs.current.totalPages ?? "").trim();
  return [title, author, totalPages].join("::");
}

function readDailyProgressCache(
  userId: string | null = getActiveUserId(),
): ReadingDailyProgressCache | null {
  try {
    const raw = getScopedStorageItem(READING_DAILY_PROGRESS_KEY, userId);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ReadingDailyProgressCache;
    if (parsed.date !== getLocalDateKey()) return null;
    if (typeof parsed.bookKey !== "string") return null;

    return {
      date: parsed.date,
      bookKey: parsed.bookKey,
      baselinePage: Math.max(parsed.baselinePage ?? 0, 0),
      latestPage: Math.max(parsed.latestPage ?? 0, 0),
    };
  } catch {
    return null;
  }
}

function writeDailyProgressCache(
  cache: ReadingDailyProgressCache,
  userId: string | null = getActiveUserId(),
) {
  if (!userId) return;

  try {
    const key = dailyProgressKey(userId);
    assertRegisteredCacheWrite(key);
    writeScopedStorageItem(
      READING_DAILY_PROGRESS_KEY,
      userId,
      JSON.stringify(cache),
    );
  } catch {
    // ignore
  }
}

function clearDailyProgressCache(userId: string | null = getActiveUserId()) {
  if (!userId) return;
  removeScopedStorageItem(READING_DAILY_PROGRESS_KEY, userId);
}

function readReadingHistoryCache(
  userId: string | null = getActiveUserId(),
): ReadingHistoryEntry[] {
  try {
    const raw = getScopedStorageItem(READING_HISTORY_KEY, userId);
    return raw ? (JSON.parse(raw) as ReadingHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeReadingHistoryCache(
  entries: ReadingHistoryEntry[],
  userId: string | null = getActiveUserId(),
) {
  if (!userId) return;

  try {
    const key = readingHistoryKey(userId);
    assertRegisteredCacheWrite(key);
    writeScopedStorageItem(READING_HISTORY_KEY, userId, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function upsertReadingHistoryEntry(
  inputs: ReadingInputs,
  cache: ReadingDailyProgressCache,
  goalPages: number,
  userId: string | null = getActiveUserId(),
) {
  const title = inputs.current.title.trim();
  const author = inputs.current.author.trim();
  const totalPages = parsePage(inputs.current.totalPages);

  if (!cache.bookKey.trim()) return;

  const entry: ReadingHistoryEntry = {
    date: cache.date,
    bookKey: cache.bookKey,
    title,
    author,
    totalPages,
    goalPages,
    baselinePage: cache.baselinePage,
    latestPage: cache.latestPage,
    pagesRead: Math.max(cache.latestPage - cache.baselinePage, 0),
    updatedAt: new Date().toISOString(),
  };

  const existing = readReadingHistoryCache(userId).filter(
    (item) => !(item.date === entry.date && item.bookKey === entry.bookKey),
  );

  existing.push(entry);
  writeReadingHistoryCache(existing, userId);
}

function createProgressSnapshot(
  date: string,
  bookKey: string,
  currentPage: number,
): ReadingDailyProgressCache {
  return {
    date,
    bookKey,
    baselinePage: currentPage,
    latestPage: currentPage,
  };
}

function syncTodayReadingProgress(
  nextInputs: ReadingInputs,
  previousInputs?: ReadingInputs | null,
  userId: string | null = getActiveUserId(),
): TodayReadingProgress {
  const bookKey = getBookKey(nextInputs);
  const currentPage = parsePage(nextInputs.current.currentPage);
  const goalPages = parseGoalPages(nextInputs.dailyGoalPages);

  if (!bookKey.trim()) {
    clearDailyProgressCache(userId);
    return { hasBook: false, goalPages, pagesRead: 0, pct: 0 };
  }

  const today = getLocalDateKey();
  const cached = readDailyProgressCache(userId);

  const previousPage =
    previousInputs && getBookKey(previousInputs) === bookKey
      ? parsePage(previousInputs.current.currentPage)
      : null;

  let nextCache: ReadingDailyProgressCache;

  if (!cached || cached.bookKey !== bookKey) {
    nextCache = createProgressSnapshot(today, bookKey, currentPage);
  } else {
    const hasPreviousPage = previousPage != null;
    const firstMeaningfulPageSet =
      cached.baselinePage === 0 &&
      cached.latestPage === 0 &&
      currentPage > 0 &&
      (!hasPreviousPage || previousPage === 0);

    if (firstMeaningfulPageSet) {
      nextCache = createProgressSnapshot(today, bookKey, currentPage);
    } else if (
      hasPreviousPage &&
      previousPage > 0 &&
      currentPage >= previousPage
    ) {
      nextCache = {
        ...cached,
        latestPage: currentPage,
      };
    } else if (
      hasPreviousPage &&
      previousPage > 0 &&
      currentPage < previousPage
    ) {
      nextCache = {
        ...cached,
        latestPage: currentPage,
      };
    } else {
      nextCache = {
        ...cached,
        latestPage: currentPage,
      };
    }
  }

  writeDailyProgressCache(nextCache, userId);
  upsertReadingHistoryEntry(nextInputs, nextCache, goalPages, userId);

  const pagesRead = Math.max(nextCache.latestPage - nextCache.baselinePage, 0);
  const pct =
    goalPages > 0
      ? Math.min(Math.round((pagesRead / goalPages) * 100), 100)
      : pagesRead > 0
        ? 100
        : 0;

  return {
    hasBook: true,
    goalPages,
    pagesRead,
    pct,
  };
}

export function getTodayReadingProgress(
  inputs: ReadingInputs,
  userId: string | null = getActiveUserId(),
): TodayReadingProgress {
  return syncTodayReadingProgress(inputs, undefined, userId);
}

function normalizeReadingInputs(
  parsed: Partial<ReadingInputs> | null | undefined,
): ReadingInputs {
  const p = parsed ?? {};
  const dailyGoalPages =
    typeof p.dailyGoalPages === "string"
      ? p.dailyGoalPages
      : DEFAULT_READING_INPUTS.dailyGoalPages;

  return {
    ...DEFAULT_READING_INPUTS,
    ...p,
    current: { ...DEFAULT_READING_INPUTS.current, ...(p.current ?? {}) },
    upNext: Array.isArray(p.upNext) ? p.upNext : [],
    completed: Array.isArray(p.completed) ? p.completed : [],
    dailyGoalPages,
    lastReadDate: typeof p.lastReadDate === "string" ? p.lastReadDate : null,
    streak: typeof p.streak === "number" ? p.streak : 0,
  };
}

async function loadPreviousInputs(
  userId: string | null,
): Promise<ReadingInputs | null> {
  if (!userId) return null;

  try {
    const raw = getScopedStorageItem(STORAGE_KEY, userId);
    return raw ? normalizeReadingInputs(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export async function loadReadingInputs(
  userId: string | null = getActiveUserId(),
): Promise<ReadingInputs> {
  if (!userId) return DEFAULT_READING_INPUTS;

  try {
    const { data, error } = await supabase
      .from("reading_state")
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    const state = (data?.state ?? null) as Partial<ReadingInputs> | null;

    if (!state) {
      removeScopedStorageItem(STORAGE_KEY, userId);
      clearDailyProgressCache(userId);
      return DEFAULT_READING_INPUTS;
    }

    const inputs = normalizeReadingInputs(state);

    try {
      const key = readingKey(userId);
      assertRegisteredCacheWrite(key);
      writeScopedStorageItem(STORAGE_KEY, userId, JSON.stringify(inputs));
    } catch {
      // ignore
    }

    return inputs;
  } catch (error) {
    console.warn(
      "loadReadingInputs failed, falling back to scoped local cache:",
      error,
    );

    const raw = getScopedStorageItem(STORAGE_KEY, userId);
    return raw
      ? normalizeReadingInputs(JSON.parse(raw))
      : DEFAULT_READING_INPUTS;
  }
}

export async function saveReadingInputs(
  userId: string | null,
  value: ReadingInputs,
): Promise<ReadingInputs> {
  if (!userId) return value;

  const previousInputs = await loadPreviousInputs(userId);

  try {
    const key = readingKey(userId);
    assertRegisteredCacheWrite(key);
    writeScopedStorageItem(STORAGE_KEY, userId, JSON.stringify(value));
  } catch {
    // ignore
  }

  syncTodayReadingProgress(value, previousInputs, userId);

  const { error } = await supabase.from("reading_state").upsert(
    {
      user_id: userId,
      state: value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;

  clearAISignalsCache(userId);
  emitReadingChanged();
  return value;
}

export async function resetReadingInputs(
  userId: string | null,
): Promise<ReadingInputs> {
  clearDailyProgressCache(userId);
  await saveReadingInputs(userId, DEFAULT_READING_INPUTS);
  return DEFAULT_READING_INPUTS;
}

export function seedReadingCache(userId: string | null): ReadingInputs {
  if (!userId) return DEFAULT_READING_INPUTS;

  try {
    const raw = getScopedStorageItem(STORAGE_KEY, userId);
    return raw
      ? normalizeReadingInputs(JSON.parse(raw))
      : DEFAULT_READING_INPUTS;
  } catch {
    return DEFAULT_READING_INPUTS;
  }
}

export function getWeeklyReadingSummary(
  inputs: ReadingInputs,
  weekStart: string,
  weekEnd: string,
): WeeklyReadingSummary {
  const history = readReadingHistoryCache(getActiveUserId())
    .filter((entry) => entry.date >= weekStart && entry.date <= weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date));

  const dedupedByDay = new Map<string, ReadingHistoryEntry>();
  for (const entry of history) {
    const existing = dedupedByDay.get(entry.date);
    if (!existing || entry.updatedAt > existing.updatedAt) {
      dedupedByDay.set(entry.date, entry);
    }
  }

  const entries = Array.from(dedupedByDay.values());
  const goalPages = parseGoalPages(inputs.dailyGoalPages);

  return {
    pagesRead: entries.reduce(
      (sum, entry) => sum + Math.max(entry.pagesRead, 0),
      0,
    ),
    goalPages,
    daysRead: entries.length,
    dataCompleteness:
      entries.length >= 5
        ? "complete"
        : entries.length > 0
          ? "partial"
          : "unknown",
  };
}

export const seedReadingInputs = seedReadingCache;