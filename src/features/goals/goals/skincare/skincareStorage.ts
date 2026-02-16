type RoutineStreakState = { lastISO: string | null; streak: number };

type DailyRoutineState = {
  dayISO: string; // YYYY-MM-DD
  amDone: boolean;
  pmDone: boolean;
};

type RoutineItemsState = {
  am: { cleanser: boolean; moisturizer: boolean; spf: boolean };
  pm: { cleanser: boolean; moisturizer: boolean; retinoid: boolean };
};

type SkinLogEntry = {
  dayISO: string;
  irritation: number; // 1-5
  acne: number; // 1-5
  hydration: number; // 1-5
  notes: string;
};

type SkinLogState = {
  entries: SkinLogEntry[]; // most recent first
};

const ns = (goalId: string, key: string) => `goals:${goalId}:skincare:${key}`;

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

// --- streak ---
export function getRoutineStreak(goalId: string): RoutineStreakState {
  return safeParse(localStorage.getItem(ns(goalId, "streak")), { lastISO: null, streak: 0 });
}
export function setRoutineStreak(goalId: string, next: RoutineStreakState) {
  localStorage.setItem(ns(goalId, "streak"), JSON.stringify(next));
}

// --- daily AM/PM ---
export function getDailyRoutine(goalId: string): DailyRoutineState {
  const today = todayISO();
  const fallback: DailyRoutineState = { dayISO: today, amDone: false, pmDone: false };
  const state = safeParse(localStorage.getItem(ns(goalId, "daily")), fallback);

  if (state.dayISO !== today) {
    localStorage.setItem(ns(goalId, "daily"), JSON.stringify(fallback));
    return fallback;
  }
  return state;
}
export function setDailyRoutine(goalId: string, next: DailyRoutineState) {
  localStorage.setItem(ns(goalId, "daily"), JSON.stringify(next));
}

// --- routine items (resets daily, but keeps structure) ---
export function getRoutineItems(goalId: string): { dayISO: string; items: RoutineItemsState } {
  const today = todayISO();
  const fallback = {
    dayISO: today,
    items: {
      am: { cleanser: false, moisturizer: false, spf: false },
      pm: { cleanser: false, moisturizer: false, retinoid: false },
    },
  };

  const state = safeParse(localStorage.getItem(ns(goalId, "items")), fallback);

  if (state.dayISO !== today) {
    localStorage.setItem(ns(goalId, "items"), JSON.stringify(fallback));
    return fallback;
  }
  return state;
}

export function setRoutineItems(goalId: string, next: { dayISO: string; items: RoutineItemsState }) {
  localStorage.setItem(ns(goalId, "items"), JSON.stringify(next));
}

// --- skin log ---
export function getSkinLog(goalId: string): SkinLogState {
  return safeParse(localStorage.getItem(ns(goalId, "log")), { entries: [] });
}
export function setSkinLog(goalId: string, next: SkinLogState) {
  localStorage.setItem(ns(goalId, "log"), JSON.stringify(next));
}
