/**
 * scheduleStorage.ts
 *
 * Persists:
 *  1. Which schedule view (wfh / office / weekend) the user has selected for today
 *  2. Which timeline blocks they've completed today
 *
 * Storage key: schedule_log_<YYYY-MM-DD>
 * Mirrors the pattern used in readingStorage / nutritionStorage.
 */

import type { ScheduleView } from "./scheduleTypes";

export const SCHEDULE_CHANGED_EVENT = "schedule:changed";

export type ScheduleLog = {
  date: string;           // "YYYY-MM-DD"
  view: ScheduleView;     // which day-type is active
  completed: number[];    // indices of completed blocks in that view's blocks array
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(date: string): string {
  return `schedule_log_${date}`;
}

/** Guess today's view from the day of the week */
export function inferTodayView(): ScheduleView {
  const day = new Date().getDay(); // 0=Sun,1=Mon,...,6=Sat
  if (day === 0 || day === 6) return "weekend";
  if (day === 1 || day === 2) return "wfh";
  return "office";
}

// ─── public API ──────────────────────────────────────────────────────────────

export function loadScheduleLog(date = todayKey()): ScheduleLog {
  try {
    const raw = localStorage.getItem(storageKey(date));
    if (raw) return JSON.parse(raw) as ScheduleLog;
  } catch {
    // ignore
  }
  return { date, view: inferTodayView(), completed: [] };
}

export function saveScheduleLog(log: ScheduleLog): void {
  try {
    localStorage.setItem(storageKey(log.date), JSON.stringify(log));
    window.dispatchEvent(new Event(SCHEDULE_CHANGED_EVENT));
  } catch {
    // storage full / private mode — fail silently
  }
}

/** Persist which schedule view (wfh/office/weekend) the user chose for today */
export function setTodayView(view: ScheduleView, date = todayKey()): void {
  const log = loadScheduleLog(date);
  // reset completed blocks when the view changes — old indices are irrelevant
  saveScheduleLog({ ...log, view, completed: [] });
}

/** Toggle a block's completed state by its index in the blocks array */
export function toggleBlock(index: number, done: boolean, date = todayKey()): void {
  const log = loadScheduleLog(date);
  const set = new Set(log.completed);
  done ? set.add(index) : set.delete(index);
  saveScheduleLog({ ...log, completed: Array.from(set) });
}

// ─── derived helpers for the dashboard ───────────────────────────────────────

export function getScheduleSummary(log: ScheduleLog, totalBlocks: number) {
  const done = log.completed.length;
  const pct = totalBlocks > 0 ? Math.round((done / totalBlocks) * 100) : 0;
  return { done, total: totalBlocks, pct };
}