import { loadModuleState, saveModuleState, seedCache } from "../goalModuleStorage";

export type RoutineStreakState = { lastISO: string | null; streak: number };
export type DailyRoutineState = { dayISO: string; amDone: boolean; pmDone: boolean };
export type RoutineItemsState = {
  am: { cleanser: boolean; moisturizer: boolean; spf: boolean };
  pm: { cleanser: boolean; moisturizer: boolean; retinoid: boolean };
};
export type SkinLogEntry = { dayISO: string; irritation: number; acne: number; hydration: number; notes: string };
export type SkinLogState  = { entries: SkinLogEntry[] };

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function diffDays(aISO: string, bISO: string) {
  return Math.round((new Date(bISO + "T00:00:00").getTime() - new Date(aISO + "T00:00:00").getTime()) / 86400000);
}

const streakDefault  = (): RoutineStreakState => ({ lastISO: null, streak: 0 });
const dailyDefault   = (): DailyRoutineState  => ({ dayISO: todayISO(), amDone: false, pmDone: false });
const itemsDefault   = () => ({ dayISO: todayISO(), items: { am: { cleanser: false, moisturizer: false, spf: false }, pm: { cleanser: false, moisturizer: false, retinoid: false } } });
const skinLogDefault = (): SkinLogState => ({ entries: [] });

function normalizeDaily(s: DailyRoutineState): DailyRoutineState {
  return s.dayISO === todayISO() ? s : dailyDefault();
}
function normalizeItems(s: ReturnType<typeof itemsDefault>) {
  return s.dayISO === todayISO() ? s : itemsDefault();
}

export function seedRoutineStreak(goalId: string) { return seedCache(goalId, "streak", streakDefault()); }
export function seedDailyRoutine(goalId: string)  { return normalizeDaily(seedCache(goalId, "daily", dailyDefault())); }
export function seedRoutineItems(goalId: string)  { return normalizeItems(seedCache(goalId, "items", itemsDefault())); }
export function seedSkinLog(goalId: string)       { return seedCache(goalId, "log", skinLogDefault()); }

export async function getRoutineStreak(goalId: string) { return loadModuleState(goalId, "streak", streakDefault()); }
export async function setRoutineStreak(goalId: string, next: RoutineStreakState) { await saveModuleState(goalId, "streak", next); }

export async function getDailyRoutine(goalId: string) { return normalizeDaily(await loadModuleState(goalId, "daily", dailyDefault())); }
export async function setDailyRoutine(goalId: string, next: DailyRoutineState) { await saveModuleState(goalId, "daily", next); }

export async function getRoutineItems(goalId: string) { return normalizeItems(await loadModuleState(goalId, "items", itemsDefault())); }
export async function setRoutineItems(goalId: string, next: ReturnType<typeof itemsDefault>) { await saveModuleState(goalId, "items", next); }

export async function getSkinLog(goalId: string) { return loadModuleState(goalId, "log", skinLogDefault()); }
export async function setSkinLog(goalId: string, next: SkinLogState) { await saveModuleState(goalId, "log", next); }