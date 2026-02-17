export type BudgetLine = { id: string; label: string; amount: number };

type CountdownState = {
  destination: string;
  departISO: string | null; // YYYY-MM-DD
  returnISO: string | null;
};

type BudgetState = {
  currency: string;
  target: number;
  lines: BudgetLine[];
};

type NotesState = {
  notes: string;
};

const ns = (goalId: string, key: string) => `goals:${goalId}:travel:${key}`;

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

// -------- countdown --------
export function getCountdown(goalId: string): CountdownState {
  return safeParse(localStorage.getItem(ns(goalId, "countdown")), {
    destination: "Next trip",
    departISO: null,
    returnISO: null,
  });
}
export function setCountdown(goalId: string, next: CountdownState) {
  localStorage.setItem(ns(goalId, "countdown"), JSON.stringify(next));
}

// -------- budget --------
export function getBudget(goalId: string, currencyFallback = "DKK"): BudgetState {
  return safeParse(localStorage.getItem(ns(goalId, "budget")), {
    currency: currencyFallback,
    target: 8000,
    lines: [
      { id: "flights", label: "Flights", amount: 0 },
      { id: "hotel", label: "Hotel", amount: 0 },
      { id: "food", label: "Food", amount: 0 },
      { id: "transport", label: "Transport", amount: 0 },
      { id: "activities", label: "Activities", amount: 0 },
    ],
  });
}
export function setBudget(goalId: string, next: BudgetState) {
  localStorage.setItem(ns(goalId, "budget"), JSON.stringify(next));
}

// -------- notes --------
export function getNotes(goalId: string): NotesState {
  return safeParse(localStorage.getItem(ns(goalId, "notes")), { notes: "" });
}
export function setNotes(goalId: string, next: NotesState) {
  localStorage.setItem(ns(goalId, "notes"), JSON.stringify(next));
}
