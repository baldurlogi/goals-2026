import { loadModuleState, saveModuleState, seedCache } from "../goalModuleStorage";

export type BudgetLine     = { id: string; label: string; amount: number };
export type CountdownState = { destination: string; departISO: string | null; returnISO: string | null };
export type BudgetState    = { currency: string; target: number; lines: BudgetLine[] };
export type NotesState     = { notes: string };

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso + "T00:00:00").getTime() - new Date(todayISO() + "T00:00:00").getTime()) / 86400000);
}

const countdownDefault = (): CountdownState => ({ destination: "Next trip", departISO: null, returnISO: null });
const budgetDefault    = (currency = "DKK"): BudgetState => ({
  currency, target: 8000,
  lines: [
    { id: "flights",    label: "Flights",    amount: 0 },
    { id: "hotel",      label: "Hotel",      amount: 0 },
    { id: "food",       label: "Food",       amount: 0 },
    { id: "transport",  label: "Transport",  amount: 0 },
    { id: "activities", label: "Activities", amount: 0 },
  ],
});
const notesDefault = (): NotesState => ({ notes: "" });

export function seedCountdown(goalId: string) { return seedCache(goalId, "countdown", countdownDefault()); }
export function seedBudget(goalId: string)    { return seedCache(goalId, "budget", budgetDefault()); }
export function seedNotes(goalId: string)     { return seedCache(goalId, "notes", notesDefault()); }

export async function getCountdown(goalId: string) { return loadModuleState(goalId, "countdown", countdownDefault()); }
export async function setCountdown(goalId: string, next: CountdownState) { await saveModuleState(goalId, "countdown", next); }

export async function getBudget(goalId: string, currencyFallback = "DKK") {
  return loadModuleState(goalId, "budget", budgetDefault(currencyFallback));
}
export async function setBudget(goalId: string, next: BudgetState) { await saveModuleState(goalId, "budget", next); }

export async function getNotes(goalId: string) { return loadModuleState(goalId, "notes", notesDefault()); }
export async function setNotes(goalId: string, next: NotesState) { await saveModuleState(goalId, "notes", next); }