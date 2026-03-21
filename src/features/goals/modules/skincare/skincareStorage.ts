import { loadModuleState, saveModuleState, seedCache } from "../goalModuleStorage";

export type RoutineStreakState = { lastISO: string | null; streak: number };
export type DailyRoutineState = { dayISO: string; amDone: boolean; pmDone: boolean };
export type RoutineSection = "am" | "pm";
export type RoutineStep = { id: string; label: string };
export type RoutineTemplateState = { am: RoutineStep[]; pm: RoutineStep[] };
export type RoutineItemsState = {
  dayISO: string;
  items: {
    am: Record<string, boolean>;
    pm: Record<string, boolean>;
  };
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
const skinLogDefault = (): SkinLogState => ({ entries: [] });
const routineTemplateDefault = (): RoutineTemplateState => ({
  am: [
    { id: "cleanser", label: "Cleanser" },
    { id: "moisturizer", label: "Moisturizer" },
    { id: "spf", label: "SPF" },
  ],
  pm: [
    { id: "cleanser", label: "Cleanser" },
    { id: "moisturizer", label: "Moisturizer" },
    { id: "retinoid", label: "Retinoid" },
  ],
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizeRoutineStepLabel(label: string) {
  return label.trim().replace(/\s+/g, " ");
}

export function createRoutineStep(label: string): RoutineStep {
  return {
    id: `step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    label: sanitizeRoutineStepLabel(label) || "New step",
  };
}

function normalizeRoutineSection(
  value: unknown,
  fallback: RoutineStep[],
  prefix: RoutineSection,
): RoutineStep[] {
  if (!Array.isArray(value)) return fallback.map((step) => ({ ...step }));

  const seen = new Set<string>();
  const steps: RoutineStep[] = [];

  value.forEach((entry, index) => {
    const rawLabel =
      typeof entry === "string"
        ? entry
        : isRecord(entry) && typeof entry.label === "string"
          ? entry.label
          : "";
    const label = sanitizeRoutineStepLabel(rawLabel);

    if (!label) return;

    const proposedId =
      isRecord(entry) && typeof entry.id === "string" && entry.id.trim()
        ? entry.id.trim()
        : `${prefix}-${index + 1}`;

    const id = seen.has(proposedId) ? `${proposedId}-${index + 1}` : proposedId;
    seen.add(id);
    steps.push({ id, label });
  });

  return steps;
}

function normalizeRoutineTemplate(value: unknown): RoutineTemplateState {
  const source = isRecord(value) ? value : {};
  const fallback = routineTemplateDefault();

  return {
    am: normalizeRoutineSection(source.am, fallback.am, "am"),
    pm: normalizeRoutineSection(source.pm, fallback.pm, "pm"),
  };
}

function buildSectionItems(
  steps: RoutineStep[],
  current: Record<string, unknown> = {},
) {
  return Object.fromEntries(
    steps.map((step) => [step.id, Boolean(current[step.id])]),
  );
}

export function buildRoutineItemsForDay(
  dayISO: string,
  routine: RoutineTemplateState,
): RoutineItemsState {
  return {
    dayISO,
    items: {
      am: buildSectionItems(routine.am),
      pm: buildSectionItems(routine.pm),
    },
  };
}

export function normalizeRoutineItems(
  value: unknown,
  routine: RoutineTemplateState,
): RoutineItemsState {
  const source = isRecord(value) ? value : {};
  const isTodayState =
    typeof source.dayISO === "string" && source.dayISO === todayISO();

  if (!isTodayState) {
    return buildRoutineItemsForDay(todayISO(), routine);
  }

  const dayISO = typeof source.dayISO === "string" ? source.dayISO : todayISO();
  const sourceItems = isRecord(source.items) ? source.items : {};
  const amItems = isRecord(sourceItems.am) ? sourceItems.am : {};
  const pmItems = isRecord(sourceItems.pm) ? sourceItems.pm : {};

  return {
    dayISO,
    items: {
      am: buildSectionItems(routine.am, amItems),
      pm: buildSectionItems(routine.pm, pmItems),
    },
  };
}

function normalizeDaily(s: DailyRoutineState): DailyRoutineState {
  return s.dayISO === todayISO() ? s : dailyDefault();
}

export function isRoutineSectionComplete(
  section: RoutineSection,
  routine: RoutineTemplateState,
  items: RoutineItemsState,
) {
  const steps = routine[section];
  return steps.length > 0 && steps.every((step) => Boolean(items.items[section][step.id]));
}

export function countCompletedRoutineSteps(
  routine: RoutineTemplateState,
  items: RoutineItemsState,
) {
  return routine.am.filter((step) => Boolean(items.items.am[step.id])).length +
    routine.pm.filter((step) => Boolean(items.items.pm[step.id])).length;
}

export function countRoutineSteps(routine: RoutineTemplateState) {
  return routine.am.length + routine.pm.length;
}

export function countCompletedRoutineSections(
  routine: RoutineTemplateState,
  items: RoutineItemsState,
) {
  return Number(isRoutineSectionComplete("am", routine, items)) +
    Number(isRoutineSectionComplete("pm", routine, items));
}

export function syncDailyRoutineWithItems(
  routine: RoutineTemplateState,
  items: RoutineItemsState,
): DailyRoutineState {
  return {
    dayISO: items.dayISO,
    amDone: isRoutineSectionComplete("am", routine, items),
    pmDone: isRoutineSectionComplete("pm", routine, items),
  };
}

export function seedRoutineStreak(goalId: string) { return seedCache(goalId, "streak", streakDefault()); }
export function seedDailyRoutine(goalId: string)  { return normalizeDaily(seedCache(goalId, "daily", dailyDefault())); }
export function seedRoutineTemplate(goalId: string) {
  return normalizeRoutineTemplate(
    seedCache(goalId, "routine", routineTemplateDefault()),
  );
}
export function seedRoutineItems(
  goalId: string,
  routine: RoutineTemplateState = seedRoutineTemplate(goalId),
) {
  return normalizeRoutineItems(
    seedCache(goalId, "items", buildRoutineItemsForDay(todayISO(), routine)),
    routine,
  );
}
export function seedSkinLog(goalId: string)       { return seedCache(goalId, "log", skinLogDefault()); }

export async function getRoutineStreak(goalId: string) { return loadModuleState(goalId, "streak", streakDefault()); }
export async function setRoutineStreak(goalId: string, next: RoutineStreakState) { await saveModuleState(goalId, "streak", next); }

export async function getDailyRoutine(goalId: string) { return normalizeDaily(await loadModuleState(goalId, "daily", dailyDefault())); }
export async function setDailyRoutine(goalId: string, next: DailyRoutineState) { await saveModuleState(goalId, "daily", next); }

export async function getRoutineTemplate(goalId: string) {
  return normalizeRoutineTemplate(
    await loadModuleState(goalId, "routine", routineTemplateDefault()),
  );
}
export async function setRoutineTemplate(goalId: string, next: RoutineTemplateState) {
  await saveModuleState(goalId, "routine", next);
}

export async function getRoutineItems(
  goalId: string,
  routine?: RoutineTemplateState,
) {
  const resolvedRoutine = routine ?? await getRoutineTemplate(goalId);
  return normalizeRoutineItems(
    await loadModuleState(goalId, "items", buildRoutineItemsForDay(todayISO(), resolvedRoutine)),
    resolvedRoutine,
  );
}
export async function setRoutineItems(goalId: string, next: RoutineItemsState) { await saveModuleState(goalId, "items", next); }

export async function getSkinLog(goalId: string) { return loadModuleState(goalId, "log", skinLogDefault()); }
export async function setSkinLog(goalId: string, next: SkinLogState) { await saveModuleState(goalId, "log", next); }
