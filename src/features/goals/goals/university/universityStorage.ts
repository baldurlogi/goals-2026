export type UniApp = {
  id: string;
  school: string;
  program: string;
  status: "Researching" | "Shortlisted" | "Applying" | "Submitted" | "Rejected" | "Accepted";
};

export type Deadline = {
  id: string;
  label: string;       // e.g. "MIT - SOP Draft v1"
  dueISO: string;      // YYYY-MM-DD
  done: boolean;
};

export type ChecklistItem = {
  id: string;
  label: string;       // e.g. "TOEFL booked"
  done: boolean;
};

type UniversityState = {
  apps: UniApp[];
  deadlines: Deadline[];
  checklist: ChecklistItem[];
};

const ns = (goalId: string) => `goals:${goalId}:university`;

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

export function daysUntil(iso: string) {
  const a = new Date(todayISO() + "T00:00:00");
  const b = new Date(iso + "T00:00:00");
  const ms = b.getTime() - a.getTime();
  return Math.ceil(ms / 86400000);
}

const DEFAULT: UniversityState = {
  apps: [
    { id: "mit", school: "MIT", program: "MS (TBD)", status: "Researching" },
    { id: "stanford", school: "Stanford", program: "MS (TBD)", status: "Researching" },
    { id: "nyu", school: "NYU", program: "MS (TBD)", status: "Researching" },
  ],
  deadlines: [
    { id: "sop-v1", label: "Statement of Purpose — Draft v1", dueISO: "2026-03-15", done: false },
    { id: "cv", label: "CV — Final polish", dueISO: "2026-03-10", done: false },
    { id: "refs", label: "Recommenders contacted", dueISO: "2026-03-05", done: false },
  ],
  checklist: [
    { id: "toefl", label: "TOEFL plan / booking", done: false },
    { id: "transcripts", label: "Transcripts requested", done: false },
    { id: "portfolio", label: "Portfolio polished", done: false },
  ],
};

export function getUniversityState(goalId: string): UniversityState {
  return safeParse(localStorage.getItem(ns(goalId)), DEFAULT);
}

export function setUniversityState(goalId: string, next: UniversityState) {
  localStorage.setItem(ns(goalId), JSON.stringify(next));
}
