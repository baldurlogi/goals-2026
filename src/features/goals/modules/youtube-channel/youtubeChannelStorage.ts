export type PipelineStage =
  | "Idea"
  | "Script"
  | "Record"
  | "Edit"
  | "Thumbnail"
  | "Upload"
  | "Published";

export type PipelineItem = {
  id: string;
  title: string;
  stage: PipelineStage;
  dueISO: string | null; // optional target date
};

type ScheduleState = {
  weekLabel: string;     // e.g. 2026-W08
  targetPerWeek: number; // e.g. 1–3 videos
  publishedThisWeek: number;
  nextUploadISO: string | null;
};

type MetricsState = {
  monthLabel: string; // YYYY-MM (optional to change later)
  subs: number;
  watchHours: number;
  videosThisYear: number;

  subsTarget: number;       // e.g. 1000
  watchHoursTarget: number; // e.g. 4000
  videosTarget: number;     // e.g. 52
};

type PipelineState = { items: PipelineItem[] };

const ns = (goalId: string, key: string) => `goals:${goalId}:youtube:${key}`;

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
  // ISO-ish week label
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getSchedule(goalId: string): ScheduleState {
  const currentWeek = weekLabel();
  const fallback: ScheduleState = {
    weekLabel: currentWeek,
    targetPerWeek: 1,
    publishedThisWeek: 0,
    nextUploadISO: null,
  };

  const state = safeParse<ScheduleState>(localStorage.getItem(ns(goalId, "schedule")), fallback);

  // auto-roll week
  if (state.weekLabel !== currentWeek) {
    localStorage.setItem(ns(goalId, "schedule"), JSON.stringify(fallback));
    return fallback;
  }
  return state;
}

export function setSchedule(goalId: string, next: ScheduleState) {
  localStorage.setItem(ns(goalId, "schedule"), JSON.stringify(next));
}

export function getMetrics(goalId: string): MetricsState {
  const currentMonth = monthLabel();
  const fallback: MetricsState = {
    monthLabel: currentMonth,
    subs: 0,
    watchHours: 0,
    videosThisYear: 0,
    subsTarget: 1000,
    watchHoursTarget: 4000,
    videosTarget: 52,
  };

  const state = safeParse<MetricsState>(localStorage.getItem(ns(goalId, "metrics")), fallback);

  // keep month label current (doesn't reset values; just updates label)
  if (state.monthLabel !== currentMonth) {
    const next = { ...state, monthLabel: currentMonth };
    localStorage.setItem(ns(goalId, "metrics"), JSON.stringify(next));
    return next;
  }
  return state;
}

export function setMetrics(goalId: string, next: MetricsState) {
  localStorage.setItem(ns(goalId, "metrics"), JSON.stringify(next));
}

export function getPipeline(goalId: string): PipelineState {
  return safeParse<PipelineState>(localStorage.getItem(ns(goalId, "pipeline")), {
    items: [],
  });
}

export function setPipeline(goalId: string, next: PipelineState) {
  localStorage.setItem(ns(goalId, "pipeline"), JSON.stringify(next));
}
