import type { ReadingDailyProgress, ReadingInputs } from "./readingTypes";
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

export type TodayReadingProgress = {
  hasBook: boolean;
  goalPages: number;
  pagesRead: number;
  pct: number;
};

function toTodayReadingProgress(
  hasBook: boolean,
  goalPages: number,
  pagesRead: number,
): TodayReadingProgress {
  const pct =
    goalPages > 0
      ? Math.min(Math.round((pagesRead / goalPages) * 100), 100)
      : pagesRead > 0
        ? 100
        : 0;

  return {
    hasBook,
    goalPages,
    pagesRead,
    pct,
  };
}

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
  dailyProgress: null,
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

function normalizeDailyProgress(
  value: unknown,
): ReadingDailyProgress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const source = value as Partial<ReadingDailyProgress>;
  if (
    typeof source.date !== "string" ||
    typeof source.bookKey !== "string"
  ) {
    return null;
  }

  return {
    date: source.date,
    bookKey: source.bookKey,
    baselinePage: Math.max(source.baselinePage ?? 0, 0),
    latestPage: Math.max(source.latestPage ?? 0, 0),
  };
}

function readDailyProgressCache(
  userId: string | null = getActiveUserId(),
): ReadingDailyProgress | null {
  try {
    const raw = getScopedStorageItem(READING_DAILY_PROGRESS_KEY, userId);
    if (!raw) return null;

    const parsed = normalizeDailyProgress(JSON.parse(raw));
    if (!parsed) return null;
    if (parsed.date !== getLocalDateKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDailyProgressCache(
  cache: ReadingDailyProgress,
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
  cache: ReadingDailyProgress,
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

function findLatestRecordedPageBeforeDate(
  bookKey: string,
  date: string,
  userId: string | null = getActiveUserId(),
): number | null {
  const entries = readReadingHistoryCache(userId)
    .filter((entry) => entry.bookKey === bookKey && entry.date < date)
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));

  const latest = entries[0];
  if (!latest) return null;

  return Math.max(latest.latestPage, 0);
}

function findRecordedProgressForDate(
  bookKey: string,
  date: string,
  userId: string | null = getActiveUserId(),
): ReadingDailyProgress | null {
  const entries = readReadingHistoryCache(userId)
    .filter((entry) => entry.bookKey === bookKey && entry.date === date)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const latest = entries[0];
  if (!latest) return null;

  return {
    date: latest.date,
    bookKey: latest.bookKey,
    baselinePage: Math.max(latest.baselinePage, 0),
    latestPage: Math.max(latest.latestPage, 0),
  };
}

function createProgressSnapshot(
  date: string,
  bookKey: string,
  currentPage: number,
  baselinePage = currentPage,
): ReadingDailyProgress {
  return {
    date,
    bookKey,
    baselinePage,
    latestPage: currentPage,
  };
}

function repairDailyProgressCandidate(
  candidate: ReadingDailyProgress | null,
  params: {
    today: string;
    bookKey: string;
    currentPage: number;
    previousRecordedPage: number | null;
  },
): ReadingDailyProgress | null {
  if (!candidate) return null;
  if (candidate.date !== params.today || candidate.bookKey !== params.bookKey) {
    return null;
  }

  let baselinePage = Math.max(candidate.baselinePage, 0);
  let latestPage = Math.max(candidate.latestPage, 0, params.currentPage);

  if (
    baselinePage === 0 &&
    latestPage > 0 &&
    params.previousRecordedPage != null &&
    latestPage >= params.previousRecordedPage
  ) {
    baselinePage = params.previousRecordedPage;
  }

  if (baselinePage > latestPage) {
    baselinePage = latestPage;
  }

  return {
    date: candidate.date,
    bookKey: candidate.bookKey,
    baselinePage,
    latestPage,
  };
}

function hydrateDailyProgress(
  inputs: ReadingInputs,
  userId: string | null,
): ReadingDailyProgress | null {
  const embedded = normalizeDailyProgress(inputs.dailyProgress);
  const today = getLocalDateKey();
  const bookKey = getBookKey(inputs);
  const currentPage = parsePage(inputs.current.currentPage);
  const previousRecordedPage = findLatestRecordedPageBeforeDate(
    bookKey,
    today,
    userId,
  );

  if (!bookKey.trim()) return null;

  const repairParams = {
    today,
    bookKey,
    currentPage,
    previousRecordedPage,
  };

  const repairedEmbedded = repairDailyProgressCandidate(embedded, repairParams);
  if (repairedEmbedded) {
    return repairedEmbedded;
  }

  const historyToday = repairDailyProgressCandidate(
    findRecordedProgressForDate(bookKey, today, userId),
    repairParams,
  );
  if (historyToday) {
    return historyToday;
  }

  const cached = repairDailyProgressCandidate(
    readDailyProgressCache(userId),
    repairParams,
  );
  if (cached) {
    return cached;
  }

  if (inputs.lastReadDate !== today || currentPage <= 0) {
    return null;
  }

  if (previousRecordedPage != null && currentPage >= previousRecordedPage) {
    return createProgressSnapshot(today, bookKey, currentPage, previousRecordedPage);
  }

  return createProgressSnapshot(today, bookKey, currentPage, currentPage);
}

function computeDailyProgress(
  nextInputs: ReadingInputs,
  previousInputs?: ReadingInputs | null,
  userId: string | null = getActiveUserId(),
): ReadingDailyProgress | null {
  const bookKey = getBookKey(nextInputs);
  const currentPage = parsePage(nextInputs.current.currentPage);

  if (!bookKey.trim()) {
    clearDailyProgressCache(userId);
    return null;
  }

  const today = getLocalDateKey();
  const previousRecordedPage = findLatestRecordedPageBeforeDate(
    bookKey,
    today,
    userId,
  );
  const repairParams = {
    today,
    bookKey,
    currentPage,
    previousRecordedPage,
  };
  const cached = repairDailyProgressCandidate(
    readDailyProgressCache(userId),
    repairParams,
  );
  const historyToday = repairDailyProgressCandidate(
    findRecordedProgressForDate(bookKey, today, userId),
    repairParams,
  );
  const nextDailyProgress = normalizeDailyProgress(nextInputs.dailyProgress);
  const previousDailyProgress = normalizeDailyProgress(previousInputs?.dailyProgress);
  const activeProgress =
    repairDailyProgressCandidate(nextDailyProgress, repairParams) ??
    repairDailyProgressCandidate(previousDailyProgress, repairParams) ??
    historyToday ??
    (cached && cached.bookKey === bookKey ? cached : null);

  const previousPage =
    previousInputs && getBookKey(previousInputs) === bookKey
      ? parsePage(previousInputs.current.currentPage)
      : null;

  let nextProgress: ReadingDailyProgress;

  if (!activeProgress) {
    const baselinePage =
      previousPage != null && previousPage > 0 && currentPage >= previousPage
        ? previousPage
        : previousRecordedPage != null &&
            previousRecordedPage > 0 &&
            currentPage >= previousRecordedPage
          ? previousRecordedPage
        : currentPage;

    nextProgress = createProgressSnapshot(
      today,
      bookKey,
      currentPage,
      baselinePage,
    );
  } else {
    const hasPreviousPage = previousPage != null;
    const shouldRecoverBaselineFromPreviousPage =
      activeProgress.baselinePage === 0 &&
      hasPreviousPage &&
      previousPage > 0 &&
      currentPage >= previousPage;
    const shouldRecoverBaselineFromHistory =
      !hasPreviousPage &&
      activeProgress.baselinePage === 0 &&
      previousRecordedPage != null &&
      previousRecordedPage > 0 &&
      currentPage >= previousRecordedPage;
    const shouldResetBaselineFromCurrentPage =
      currentPage > 0 && currentPage < activeProgress.baselinePage;

    if (shouldRecoverBaselineFromPreviousPage) {
      nextProgress = {
        ...activeProgress,
        baselinePage: previousPage,
        latestPage: currentPage,
      };
    } else if (shouldRecoverBaselineFromHistory) {
      nextProgress = {
        ...activeProgress,
        baselinePage: previousRecordedPage,
        latestPage: currentPage,
      };
    } else if (shouldResetBaselineFromCurrentPage) {
      nextProgress = createProgressSnapshot(
        today,
        bookKey,
        currentPage,
        currentPage,
      );
    } else {
      const firstMeaningfulPageSet =
        activeProgress.baselinePage === 0 &&
        activeProgress.latestPage === 0 &&
      currentPage > 0 &&
      (!hasPreviousPage || previousPage === 0);

      if (firstMeaningfulPageSet) {
        nextProgress = createProgressSnapshot(today, bookKey, currentPage);
      } else if (
        hasPreviousPage &&
        previousPage > 0 &&
        currentPage >= previousPage
      ) {
        nextProgress = {
          ...activeProgress,
          latestPage: currentPage,
        };
      } else if (
        hasPreviousPage &&
        previousPage > 0 &&
        currentPage < previousPage
      ) {
        // Treat a backward page edit as a deliberate baseline reset for today.
        nextProgress = createProgressSnapshot(today, bookKey, currentPage, currentPage);
      } else {
        nextProgress = {
          ...activeProgress,
          latestPage: currentPage,
        };
      }
    }
  }

  writeDailyProgressCache(nextProgress, userId);
  return nextProgress;
}

function applyReadingStreakFromProgress(
  nextInputs: ReadingInputs,
  previousInputs: ReadingInputs | null | undefined,
): Pick<ReadingInputs, "streak" | "lastReadDate"> {
  const today = getLocalDateKey();
  const nextBookKey = getBookKey(nextInputs);
  const previousBookKey = previousInputs ? getBookKey(previousInputs) : "";
  const nextPage = parsePage(nextInputs.current.currentPage);
  const previousPage =
    previousInputs && previousBookKey === nextBookKey
      ? parsePage(previousInputs.current.currentPage)
      : 0;
  const lastReadDate = nextInputs.lastReadDate ?? previousInputs?.lastReadDate ?? null;
  const streak = nextInputs.streak ?? previousInputs?.streak ?? 0;

  if (!nextBookKey.trim() || nextPage <= 0) {
    return {
      streak: nextInputs.streak ?? 0,
      lastReadDate: nextInputs.lastReadDate ?? null,
    };
  }

  const pageIncreased = nextBookKey.trim().length > 0 && nextPage > previousPage;

  if (!pageIncreased) {
    return {
      streak,
      lastReadDate,
    };
  }

  if (lastReadDate === today) {
    return {
      streak: Math.max(streak, 1),
      lastReadDate,
    };
  }

  const yesterday = new Date(`${today}T00:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  if (lastReadDate === yesterdayKey) {
    return {
      streak: Math.max(streak, 0) + 1,
      lastReadDate: today,
    };
  }

  return {
    streak: 1,
    lastReadDate: today,
  };
}

export function getTodayReadingProgress(
  inputs: ReadingInputs,
  userId: string | null = getActiveUserId(),
): TodayReadingProgress {
  const bookKey = getBookKey(inputs);
  const currentPage = parsePage(inputs.current.currentPage);
  const goalPages = parseGoalPages(inputs.dailyGoalPages);

  if (!bookKey.trim()) {
    return toTodayReadingProgress(false, goalPages, 0);
  }

  const progress = hydrateDailyProgress(inputs, userId);

  if (!progress || progress.bookKey !== bookKey) {
    return toTodayReadingProgress(true, goalPages, 0);
  }

  const latestPage = Math.max(currentPage, progress.latestPage);
  const pagesRead = Math.max(latestPage - progress.baselinePage, 0);
  return toTodayReadingProgress(true, goalPages, pagesRead);
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
    dailyProgress: normalizeDailyProgress(p.dailyProgress),
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
    const hydratedProgress = hydrateDailyProgress(inputs, userId);
    const hydratedInputs = {
      ...inputs,
      dailyProgress: hydratedProgress,
    };

    try {
      const key = readingKey(userId);
      assertRegisteredCacheWrite(key);
      writeScopedStorageItem(STORAGE_KEY, userId, JSON.stringify(hydratedInputs));
    } catch {
      // ignore
    }

    return hydratedInputs;
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
  options?: {
    previousInputs?: ReadingInputs | null;
  },
): Promise<ReadingInputs> {
  if (!userId) return value;

  const previousInputs =
    options?.previousInputs === undefined
      ? await loadPreviousInputs(userId)
      : options.previousInputs;
  const dailyProgress = computeDailyProgress(value, previousInputs, userId);
  const goalPages = parseGoalPages(value.dailyGoalPages);
  const streakState = applyReadingStreakFromProgress(value, previousInputs);
  const nextValue: ReadingInputs = {
    ...value,
    ...streakState,
    dailyProgress,
  };

  try {
    const key = readingKey(userId);
    assertRegisteredCacheWrite(key);
    writeScopedStorageItem(STORAGE_KEY, userId, JSON.stringify(nextValue));
  } catch {
    // ignore
  }

  if (dailyProgress) {
    upsertReadingHistoryEntry(nextValue, dailyProgress, goalPages, userId);
  } else {
    clearDailyProgressCache(userId);
  }

  const { error } = await supabase.from("reading_state").upsert(
    {
      user_id: userId,
      state: nextValue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;

  clearAISignalsCache(userId);
  emitReadingChanged();
  return nextValue;
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
