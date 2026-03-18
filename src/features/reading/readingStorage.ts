// src/features/reading/readingStorage.ts
import type { ReadingInputs } from "./readingTypes";
import { supabase } from "@/lib/supabaseClient";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import { getActiveUserId, scopedKey } from "@/lib/activeUser";

// Local key only used for optional legacy fallback + migration safety
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

function aiSignalsKey(userId: string | null = getActiveUserId()) {
  return scopedKey(AI_SIGNALS_CACHE_KEY, userId);
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

function clearAISignalsCache(userId: string | null = getActiveUserId()) {
  try {
    localStorage.removeItem(aiSignalsKey(userId));
  } catch {
    // ignore
  }
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

function readDailyProgressCache(userId: string | null = getActiveUserId()): ReadingDailyProgressCache | null {
  try {
    const raw = localStorage.getItem(dailyProgressKey(userId));
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

function writeDailyProgressCache(cache: ReadingDailyProgressCache, userId: string | null = getActiveUserId()) {
  try {
    const key = dailyProgressKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function clearDailyProgressCache(userId: string | null = getActiveUserId()) {
  try {
    localStorage.removeItem(dailyProgressKey(userId));
  } catch {
    // ignore
  }
}

function readReadingHistoryCache(userId: string | null = getActiveUserId()): ReadingHistoryEntry[] {
  try {
    const raw = localStorage.getItem(readingHistoryKey(userId));
    return raw ? (JSON.parse(raw) as ReadingHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeReadingHistoryCache(entries: ReadingHistoryEntry[], userId: string | null = getActiveUserId()) {
  try {
    const key = readingHistoryKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(entries));
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

  // First reading snapshot of the day for this book:
  // treat the current absolute page as the baseline, not as "pages read today".
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
      // Example:
      // user starts tracking a book and enters "103" as current page.
      // That should establish today's baseline at 103, not count as 103 pages read today.
      nextCache = createProgressSnapshot(today, bookKey, currentPage);
    } else if (hasPreviousPage && previousPage > 0 && currentPage >= previousPage) {
      // Normal forward progress during the day.
      nextCache = {
        ...cached,
        latestPage: currentPage,
      };
    } else if (hasPreviousPage && previousPage > 0 && currentPage < previousPage) {
      // Manual correction downward:
      // keep the original day's baseline, but update latest to the corrected page.
      nextCache = {
        ...cached,
        latestPage: currentPage,
      };
    } else {
      // Read-only calls / hydration / no usable previous page:
      // preserve baseline and make sure latest reflects current state.
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

export function getTodayReadingProgress(inputs: ReadingInputs): TodayReadingProgress {
  return syncTodayReadingProgress(inputs);
}

// helper: merge partial into defaults safely
function normalizeReadingInputs(parsed: Partial<ReadingInputs> | null | undefined): ReadingInputs {
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

async function loadPreviousInputs(userId: string | null = getActiveUserId()): Promise<ReadingInputs | null> {
  try {
    const raw = localStorage.getItem(readingKey(userId));
    return raw ? normalizeReadingInputs(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/**
 * Load reading from Supabase (reading_state).
 * Falls back to localStorage if:
 *  - not logged in
 *  - Supabase errors
 *  - no row exists yet
 */
export async function loadReadingInputs(): Promise<ReadingInputs> {
  try {
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    const user = auth?.user;

    if (!user) {
      const raw = localStorage.getItem(readingKey(getActiveUserId()));
      const inputs = raw ? normalizeReadingInputs(JSON.parse(raw)) : DEFAULT_READING_INPUTS;
      syncTodayReadingProgress(inputs, undefined, null);
      return inputs;
    }

    const { data, error } = await supabase
      .from("reading_state")
      .select("state")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    const state = (data?.state ?? null) as Partial<ReadingInputs> | null;
    if (!state) {
      try {
        localStorage.removeItem(readingKey(user.id));
      } catch {
        // ignore
      }

      syncTodayReadingProgress(DEFAULT_READING_INPUTS, undefined, user.id);
      return DEFAULT_READING_INPUTS;
    }

    const inputs = normalizeReadingInputs(state);

    try {
      const key = readingKey(user.id);
      assertRegisteredCacheWrite(key);
      localStorage.setItem(key, JSON.stringify(inputs));
    } catch {
      // ignore
    }

    syncTodayReadingProgress(inputs, undefined, user.id);
    return inputs;
  } catch (error) {
    console.warn("loadReadingInputs failed, falling back to defaults/local:", error);
    const raw = localStorage.getItem(readingKey(getActiveUserId()));
    const inputs = raw ? normalizeReadingInputs(JSON.parse(raw)) : DEFAULT_READING_INPUTS;
    syncTodayReadingProgress(inputs);
    return inputs;
  }
}

/**
 * Save reading to Supabase (reading_state).
 * Also mirrors to localStorage for offline-ish resilience.
 */
export async function saveReadingInputs(value: ReadingInputs): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  const scopedUserId = user?.id ?? null;
  const previousInputs = await loadPreviousInputs(scopedUserId);

  try {
    const key = readingKey(scopedUserId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }

  syncTodayReadingProgress(value, previousInputs, scopedUserId);

  if (!user) {
    clearAISignalsCache(null);
    emitReadingChanged();
    return;
  }

  const { error } = await supabase
    .from("reading_state")
    .upsert(
      {
        user_id: user.id,
        state: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) throw error;

  clearAISignalsCache(user.id);
  emitReadingChanged();
}

export async function resetReadingInputs(): Promise<ReadingInputs> {
  clearDailyProgressCache(getActiveUserId());
  await saveReadingInputs(DEFAULT_READING_INPUTS);
  return DEFAULT_READING_INPUTS;
}

/** Synchronous seed — reads from localStorage mirror. Zero network. */
export function seedReadingInputs(): ReadingInputs {
  try {
    const raw = localStorage.getItem(readingKey(getActiveUserId()));
    const inputs = raw ? normalizeReadingInputs(JSON.parse(raw)) : DEFAULT_READING_INPUTS;
    syncTodayReadingProgress(inputs);
    return inputs;
  } catch {
    syncTodayReadingProgress(DEFAULT_READING_INPUTS);
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
    pagesRead: entries.reduce((sum, entry) => sum + Math.max(entry.pagesRead, 0), 0),
    goalPages,
    daysRead: entries.length,
    dataCompleteness:
      entries.length >= 5 ? "complete" : entries.length > 0 ? "partial" : "unknown",
  };
}