import { loadModuleState, saveModuleState, seedCache } from "../goalModuleStorage";

export type StudyStreakState = { lastISO: string | null; streak: number };
export type DrillState = { monthLabel: string; leetcodeDone: number; target: number };
export type FocusState = { currentFocus: "JavaScript" | "TypeScript" | "React" | "Frontend"; notes: string };

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function diffDays(aISO: string, bISO: string) {
  return Math.round((new Date(bISO + "T00:00:00").getTime() - new Date(aISO + "T00:00:00").getTime()) / 86400000);
}
function monthLabel(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const streakDefault = (): StudyStreakState => ({ lastISO: null, streak: 0 });
const drillDefault  = (): DrillState      => ({ monthLabel: monthLabel(), leetcodeDone: 0, target: 30 });
const focusDefault  = (): FocusState      => ({ currentFocus: "JavaScript", notes: "" });

function normalizeDrill(s: DrillState): DrillState {
  return s.monthLabel === monthLabel() ? s : drillDefault();
}

export function seedStudyStreak(goalId: string) { return seedCache(goalId, "streak", streakDefault()); }
export function seedDrills(goalId: string)      { return normalizeDrill(seedCache(goalId, "drills", drillDefault())); }
export function seedFocus(goalId: string)       { return seedCache(goalId, "focus", focusDefault()); }

export async function getStudyStreak(goalId: string) { return loadModuleState(goalId, "streak", streakDefault()); }
export async function setStudyStreak(goalId: string, next: StudyStreakState) { await saveModuleState(goalId, "streak", next); }

export async function getDrills(goalId: string) { return normalizeDrill(await loadModuleState(goalId, "drills", drillDefault())); }
export async function setDrills(goalId: string, next: DrillState) { await saveModuleState(goalId, "drills", next); }

export async function getFocus(goalId: string) { return loadModuleState(goalId, "focus", focusDefault()); }
export async function setFocus(goalId: string, next: FocusState) { await saveModuleState(goalId, "focus", next); }