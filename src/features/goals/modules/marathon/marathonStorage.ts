type RunStreakState = { lastRunISO: string | null; streak: number };

type WeeklyMileageState = {
  weekStartISO: string; // Monday YYYY-MM-DD
  targetKm: number;
  doneKm: number;
};

type LongRunState = {
  nextLongRunKm: number;
  scheduledISO: string | null; // YYYY-MM-DD
  notes: string;
};

const ns = (goalId: string, key: string) => `goals:${goalId}:marathon:${key}`;

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

export function getMondayISO(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // Sun=0
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diffToMonday);
  return todayISO(date);
}

// -------- streak --------

export function getRunStreak(goalId: string): RunStreakState {
  return safeParse(localStorage.getItem(ns(goalId, "streak")), {
    lastRunISO: null,
    streak: 0,
  });
}

export function setRunStreak(goalId: string, next: RunStreakState) {
  localStorage.setItem(ns(goalId, "streak"), JSON.stringify(next));
}

// -------- weekly mileage --------

export function getWeeklyMileage(goalId: string): WeeklyMileageState {
  const monday = getMondayISO(new Date());
  const fallback: WeeklyMileageState = { weekStartISO: monday, targetKm: 20, doneKm: 0 };
  const state = safeParse(localStorage.getItem(ns(goalId, "weeklyKm")), fallback);

  if (state.weekStartISO !== monday) {
    localStorage.setItem(ns(goalId, "weeklyKm"), JSON.stringify(fallback));
    return fallback;
  }
  return state;
}

export function setWeeklyMileage(goalId: string, next: WeeklyMileageState) {
  localStorage.setItem(ns(goalId, "weeklyKm"), JSON.stringify(next));
}

// -------- long run planner --------

export function getLongRun(goalId: string): LongRunState {
  return safeParse(localStorage.getItem(ns(goalId, "longRun")), {
    nextLongRunKm: 10,
    scheduledISO: null,
    notes: "",
  });
}

export function setLongRun(goalId: string, next: LongRunState) {
  localStorage.setItem(ns(goalId, "longRun"), JSON.stringify(next));
}
