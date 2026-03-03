import { loadModuleState, saveModuleState, seedCache } from "../goalModuleStorage";

export type RevenueState  = { monthlyTargetDKK: number; monthLabel: string; earnedDKK: number };
export type PipelineState = { weekLabel: string; proposalsSent: number; replies: number; callsBooked: number; clientsWon: number };
export type SaaSStage =
  | "Idea validation" | "MVP design" | "MVP build" | "Beta users"
  | "Payments (Stripe)" | "Launch (Product Hunt)" | "First paying customer";
export type SaaSState = { stage: SaaSStage; notes: string };

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

const revenueDefault  = (): RevenueState  => ({ monthLabel: monthLabel(), monthlyTargetDKK: 15000, earnedDKK: 0 });
const pipelineDefault = (): PipelineState => ({ weekLabel: weekLabel(), proposalsSent: 0, replies: 0, callsBooked: 0, clientsWon: 0 });
const saasDefault     = (): SaaSState     => ({ stage: "Idea validation", notes: "" });

function normalizeRevenue(s: RevenueState): RevenueState {
  return s.monthLabel === monthLabel() ? s : revenueDefault();
}
function normalizePipeline(s: PipelineState): PipelineState {
  return s.weekLabel === weekLabel() ? s : pipelineDefault();
}

export function seedRevenue(goalId: string)  { return normalizeRevenue(seedCache(goalId, "revenue", revenueDefault())); }
export function seedPipeline(goalId: string) { return normalizePipeline(seedCache(goalId, "pipeline", pipelineDefault())); }
export function seedSaaS(goalId: string)     { return seedCache(goalId, "saas", saasDefault()); }

export async function getRevenue(goalId: string)  { return normalizeRevenue(await loadModuleState(goalId, "revenue", revenueDefault())); }
export async function setRevenue(goalId: string, next: RevenueState)   { await saveModuleState(goalId, "revenue", next); }

export async function getPipeline(goalId: string) { return normalizePipeline(await loadModuleState(goalId, "pipeline", pipelineDefault())); }
export async function setPipeline(goalId: string, next: PipelineState) { await saveModuleState(goalId, "pipeline", next); }

export async function getSaaS(goalId: string)     { return loadModuleState(goalId, "saas", saasDefault()); }
export async function setSaaS(goalId: string, next: SaaSState)         { await saveModuleState(goalId, "saas", next); }