type ReadingStreakState = { lastReadISO: string | null; streak: number };

type ReadingMinutesState = {
  dayISO: string; // YYYY-MM-DD (auto-roll daily)
  minutes: number;
  target: number;
};

type BookProgressState = {
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
};

const ns = (goalId: string, key: string) => `goals:${goalId}:reading:${key}`;

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function todayISO(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function diffDays(aISO: string, bISO: string) {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// ---- streak ----
export function getReadingStreak(goalId: string): ReadingStreakState {
  return safeParse(localStorage.getItem(ns(goalId, "streak")), {
    lastReadISO: null,
    streak: 0,
  });
}

export function setReadingStreak(goalId: string, next: ReadingStreakState) {
  localStorage.setItem(ns(goalId, "streak"), JSON.stringify(next));
}

// ---- minutes ----
export function getReadingMinutes(goalId: string): ReadingMinutesState {
  const today = todayISO();
  const fallback: ReadingMinutesState = { dayISO: today, minutes: 0, target: 30 };
  const state = safeParse(localStorage.getItem(ns(goalId, "minutes")), fallback);

  if (state.dayISO !== today) {
    localStorage.setItem(ns(goalId, "minutes"), JSON.stringify(fallback));
    return fallback;
  }
  return state;
}

export function setReadingMinutes(goalId: string, next: ReadingMinutesState) {
  localStorage.setItem(ns(goalId, "minutes"), JSON.stringify(next));
}

// ---- book ----
export function getBookProgress(goalId: string): BookProgressState {
  return safeParse(localStorage.getItem(ns(goalId, "book")), {
    title: "Current book",
    author: "",
    totalPages: 300,
    currentPage: 0,
  });
}

export function setBookProgress(goalId: string, next: BookProgressState) {
  localStorage.setItem(ns(goalId, "book"), JSON.stringify(next));
}
