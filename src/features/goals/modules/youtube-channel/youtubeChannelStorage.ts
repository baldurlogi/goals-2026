import { loadModuleState, saveModuleState, seedCache } from "../goalModuleStorage";

export type PipelineStage = "Idea" | "Script" | "Record" | "Edit" | "Thumbnail" | "Upload" | "Published";
export type PipelineItem  = { id: string; title: string; stage: PipelineStage; dueISO: string | null };
export type ScheduleState = { weekLabel: string; targetPerWeek: number; publishedThisWeek: number; nextUploadISO: string | null };
export type MetricsState  = { monthLabel: string; subs: number; watchHours: number; videosThisYear: number; subsTarget: number; watchHoursTarget: number; videosTarget: number };
export type PipelineState = { items: PipelineItem[] };

function monthLabel(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function weekLabel(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const scheduleDefault = (): ScheduleState => ({ weekLabel: weekLabel(), targetPerWeek: 1, publishedThisWeek: 0, nextUploadISO: null });
const metricsDefault  = (): MetricsState  => ({ monthLabel: monthLabel(), subs: 0, watchHours: 0, videosThisYear: 0, subsTarget: 1000, watchHoursTarget: 4000, videosTarget: 52 });
const pipelineDefault = (): PipelineState => ({ items: [] });

function normalizeSchedule(s: ScheduleState): ScheduleState {
  return s.weekLabel === weekLabel() ? s : scheduleDefault();
}
function normalizeMetrics(s: MetricsState): MetricsState {
  return s.monthLabel === monthLabel() ? s : { ...s, monthLabel: monthLabel() };
}

export function seedSchedule(goalId: string) { return normalizeSchedule(seedCache(goalId, "schedule", scheduleDefault())); }
export function seedMetrics(goalId: string)  { return normalizeMetrics(seedCache(goalId, "metrics", metricsDefault())); }
export function seedPipeline(goalId: string) { return seedCache(goalId, "pipeline", pipelineDefault()); }

export async function getSchedule(goalId: string) { return normalizeSchedule(await loadModuleState(goalId, "schedule", scheduleDefault())); }
export async function setSchedule(goalId: string, next: ScheduleState) { await saveModuleState(goalId, "schedule", next); }

export async function getMetrics(goalId: string) { return normalizeMetrics(await loadModuleState(goalId, "metrics", metricsDefault())); }
export async function setMetrics(goalId: string, next: MetricsState) { await saveModuleState(goalId, "metrics", next); }

export async function getPipeline(goalId: string) { return loadModuleState(goalId, "pipeline", pipelineDefault()); }
export async function setPipeline(goalId: string, next: PipelineState) { await saveModuleState(goalId, "pipeline", next); }