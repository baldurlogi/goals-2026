type StudyStreakState = { lastISO: string | null; streak: number };

type DrillState = {
  monthLabel: string; // YYYY-MM
  leetcodeDone: number; // progress toward 30
  target: number; // default 30
};

type FocusState = {
  currentFocus: "JavaScript" | "TypeScript" | "React" | "Frontend";
  notes: string;
};

const ns = (goalId: string, key: string) => `goals:${goalId}:frontend:${key}`;

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

function monthLabel(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getStudyStreak(goalId: string): StudyStreakState {
  return safeParse(localStorage.getItem(ns(goalId, "streak")), {
    lastISO: null,
    streak: 0,
  });
}

export function setStudyStreak(goalId: string, next: StudyStreakState) {
  localStorage.setItem(ns(goalId, "streak"), JSON.stringify(next));
}

export function getDrills(goalId: string): DrillState {
  const current = monthLabel();
  const fallback: DrillState = { monthLabel: current, leetcodeDone: 0, target: 30 };
  const state = safeParse(localStorage.getItem(ns(goalId, "drills")), fallback);

  if (state.monthLabel !== current) {
    localStorage.setItem(ns(goalId, "drills"), JSON.stringify(fallback));
    return fallback;
  }
  return state;
}

export function setDrills(goalId: string, next: DrillState) {
  localStorage.setItem(ns(goalId, "drills"), JSON.stringify(next));
}

export function getFocus(goalId: string): FocusState {
  return safeParse(localStorage.getItem(ns(goalId, "focus")), {
    currentFocus: "JavaScript",
    notes: "",
  });
}

export function setFocus(goalId: string, next: FocusState) {
  localStorage.setItem(ns(goalId, "focus"), JSON.stringify(next));
}
