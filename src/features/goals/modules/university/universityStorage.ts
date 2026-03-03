import { loadModuleState, saveModuleState, seedCache } from "../goalModuleStorage";

export type UniApp = {
  id: string; school: string; program: string;
  status: "Researching" | "Shortlisted" | "Applying" | "Submitted" | "Rejected" | "Accepted";
};
export type Deadline      = { id: string; label: string; dueISO: string; done: boolean };
export type ChecklistItem = { id: string; label: string; done: boolean };
export type UniversityState = { apps: UniApp[]; deadlines: Deadline[]; checklist: ChecklistItem[] };

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso + "T00:00:00").getTime() - new Date(todayISO() + "T00:00:00").getTime()) / 86400000);
}

const DEFAULT: UniversityState = {
  apps: [
    { id: "mit",      school: "MIT",      program: "MS (TBD)", status: "Researching" },
    { id: "stanford", school: "Stanford", program: "MS (TBD)", status: "Researching" },
    { id: "nyu",      school: "NYU",      program: "MS (TBD)", status: "Researching" },
  ],
  deadlines: [
    { id: "sop-v1", label: "Statement of Purpose — Draft v1", dueISO: "2026-03-15", done: false },
    { id: "cv",     label: "CV — Final polish",               dueISO: "2026-03-10", done: false },
    { id: "refs",   label: "Recommenders contacted",          dueISO: "2026-03-05", done: false },
  ],
  checklist: [
    { id: "toefl",       label: "TOEFL plan / booking",    done: false },
    { id: "transcripts", label: "Transcripts requested",   done: false },
    { id: "portfolio",   label: "Portfolio polished",      done: false },
  ],
};

export function seedUniversityState(goalId: string) { return seedCache(goalId, "state", DEFAULT); }
export async function getUniversityState(goalId: string) { return loadModuleState(goalId, "state", DEFAULT); }
export async function setUniversityState(goalId: string, next: UniversityState) { await saveModuleState(goalId, "state", next); }``