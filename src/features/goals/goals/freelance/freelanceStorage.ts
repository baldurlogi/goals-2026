type RevenueState = {
  monthlyTargetDKK: number;
  monthLabel: string; // e.g. "2026-02"
  earnedDKK: number;
};

type PipelineState = {
  weekLabel: string; // e.g. "2026-W08"
  proposalsSent: number;
  replies: number;
  callsBooked: number;
  clientsWon: number;
};

export type SaaSStage =
  | "Idea validation"
  | "MVP design"
  | "MVP build"
  | "Beta users"
  | "Payments (Stripe)"
  | "Launch (Product Hunt)"
  | "First paying customer";

type SaaSState = {
  stage: SaaSStage;
  notes: string;
};

const ns = (goalId: string, key: string) => `goals:${goalId}:freelance:${key}`;

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function monthLabel(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function weekLabel(d = new Date()) {
  // simple ISO-ish week label (good enough for tracking)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getRevenue(goalId: string): RevenueState {
  const currentMonth = monthLabel();
  const fallback: RevenueState = { monthLabel: currentMonth, monthlyTargetDKK: 15000, earnedDKK: 0 };

  const state = safeParse<RevenueState>(localStorage.getItem(ns(goalId, "revenue")), fallback);

  // auto-roll month
  if (state.monthLabel !== currentMonth) {
    const next = { ...fallback };
    localStorage.setItem(ns(goalId, "revenue"), JSON.stringify(next));
    return next;
  }
  return state;
}

export function setRevenue(goalId: string, next: RevenueState) {
  localStorage.setItem(ns(goalId, "revenue"), JSON.stringify(next));
}

export function getPipeline(goalId: string): PipelineState {
  const currentWeek = weekLabel();
  const fallback: PipelineState = { weekLabel: currentWeek, proposalsSent: 0, replies: 0, callsBooked: 0, clientsWon: 0 };

  const state = safeParse<PipelineState>(localStorage.getItem(ns(goalId, "pipeline")), fallback);

  // auto-roll week
  if (state.weekLabel !== currentWeek) {
    const next = { ...fallback };
    localStorage.setItem(ns(goalId, "pipeline"), JSON.stringify(next));
    return next;
  }
  return state;
}

export function setPipeline(goalId: string, next: PipelineState) {
  localStorage.setItem(ns(goalId, "pipeline"), JSON.stringify(next));
}

export function getSaaS(goalId: string): SaaSState {
  return safeParse<SaaSState>(localStorage.getItem(ns(goalId, "saas")), {
    stage: "Idea validation",
    notes: "",
  });
}

export function setSaaS(goalId: string, next: SaaSState) {
  localStorage.setItem(ns(goalId, "saas"), JSON.stringify(next));
}
