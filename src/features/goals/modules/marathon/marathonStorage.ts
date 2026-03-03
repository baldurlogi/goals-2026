import { loadModuleState, saveModuleState, seedCache } from "../goalModuleStorage";

export type RunStreakState     = { lastRunISO: string | null; streak: number };
export type WeeklyMileageState = { weekStartISO: string; targetKm: number; doneKm: number };
export type LongRunState       = { nextLongRunKm: number; scheduledISO: string | null; notes: string };

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function diffDays(aISO: string, bISO: string) {
  return Math.round((new Date(bISO + "T00:00:00").getTime() - new Date(aISO + "T00:00:00").getTime()) / 86400000);
}
export function getMondayISO(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1) - day);
  return todayISO(date);
}

const streakDefault  = (): RunStreakState     => ({ lastRunISO: null, streak: 0 });
const mileageDefault = (): WeeklyMileageState => ({ weekStartISO: getMondayISO(), targetKm: 20, doneKm: 0 });
const longRunDefault = (): LongRunState       => ({ nextLongRunKm: 10, scheduledISO: null, notes: "" });

function normalizeMileage(s: WeeklyMileageState): WeeklyMileageState {
  return s.weekStartISO === getMondayISO() ? s : mileageDefault();
}

export function seedRunStreak(goalId: string)     { return seedCache(goalId, "streak", streakDefault()); }
export function seedWeeklyMileage(goalId: string) { return normalizeMileage(seedCache(goalId, "weeklyKm", mileageDefault())); }
export function seedLongRun(goalId: string)       { return seedCache(goalId, "longRun", longRunDefault()); }

export async function getRunStreak(goalId: string) { return loadModuleState(goalId, "streak", streakDefault()); }
export async function setRunStreak(goalId: string, next: RunStreakState) { await saveModuleState(goalId, "streak", next); }

export async function getWeeklyMileage(goalId: string) { return normalizeMileage(await loadModuleState(goalId, "weeklyKm", mileageDefault())); }
export async function setWeeklyMileage(goalId: string, next: WeeklyMileageState) { await saveModuleState(goalId, "weeklyKm", next); }

export async function getLongRun(goalId: string) { return loadModuleState(goalId, "longRun", longRunDefault()); }
export async function setLongRun(goalId: string, next: LongRunState) { await saveModuleState(goalId, "longRun", next); }