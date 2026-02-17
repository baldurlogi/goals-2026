type StreakState = {
  lastWorkoutISO: string | null; // YYYY-MM-DD
  streak: number;
};

type WeeklySplitState = {
  weekStartISO: string; // Monday YYYY-MM-DD
  doneByDay: Record<
    "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun",
    boolean
  >;
};

const ns = (goalId: string, key: string) => `goals:${goalId}:fitness:${key}`;

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getStreak(goalId: string): StreakState {
  return safeParse<StreakState>(localStorage.getItem(ns(goalId, "streak")), {
    lastWorkoutISO: null,
    streak: 0,
  });
}

export function setStreak(goalId: string, next: StreakState) {
  localStorage.setItem(ns(goalId, "streak"), JSON.stringify(next));
}

export function getWeeklySplit(goalId: string): WeeklySplitState {
  const monday = getMondayISO(new Date());
  return safeParse<WeeklySplitState>(localStorage.getItem(ns(goalId, "weekly")), {
    weekStartISO: monday,
    doneByDay: {
      Mon: false,
      Tue: false,
      Wed: false,
      Thu: false,
      Fri: false,
      Sat: false,
      Sun: false,
    },
  });
}

export function setWeeklySplit(goalId: string, next: WeeklySplitState) {
  localStorage.setItem(ns(goalId, "weekly"), JSON.stringify(next));
}

export function todayISO(d = new Date()) {
  // local date YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function diffDays(aISO: string, bISO: string) {
  // days between dates (b - a)
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function getMondayISO(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // Sun=0
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diffToMonday);
  return todayISO(date);
}
