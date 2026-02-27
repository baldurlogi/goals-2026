import { supabase } from "@/lib/supabaseClient";
import { readJson, writeJson } from "@/lib/storage";

export const FITNESS_CHANGED_EVENT = "fitness:changed";
function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FITNESS_CHANGED_EVENT));
  }
}

export type LiftId = "bench" | "squat" | "ohp" | "clean" | "snatch";
export type SkillId =
  | "butterfly_pullups"
  | "muscle_ups"
  | "hsw"
  | "freestanding_hspu"
  | "strict_hspu"
  | "swim_100m"
  | "swim_200m";
export type SkillMetricType = "reps" | "metres" | "seconds";

export type PREntry = { value: number; date: string; notes?: string };

export type LiftRecord = {
  id: LiftId;
  label: string;
  unit: "kg";
  goal: number;
  history: PREntry[];
};

export type SkillRecord = {
  id: SkillId;
  label: string;
  category: "crossfit" | "swimming";
  metricType: SkillMetricType;
  unit: string;
  goal: number;
  goalLabel?: string;
  history: PREntry[];
};

export type FitnessStore = {
  lifts: Record<LiftId, LiftRecord>;
  skills: Record<SkillId, SkillRecord>;
};

export const DEFAULT_STORE: FitnessStore = {
  lifts: {
    bench: { id: "bench", label: "Bench Press", unit: "kg", goal: 100, history: [] },
    squat: { id: "squat", label: "Back Squat", unit: "kg", goal: 140, history: [] },
    ohp: { id: "ohp", label: "Overhead Press", unit: "kg", goal: 70, history: [] },
    clean: { id: "clean", label: "Power Clean", unit: "kg", goal: 90, history: [] },
    snatch: { id: "snatch", label: "Snatch", unit: "kg", goal: 70, history: [] },
  },
  skills: {
    butterfly_pullups: {
      id: "butterfly_pullups",
      label: "Butterfly Pull-ups",
      category: "crossfit",
      metricType: "reps",
      unit: "reps",
      goal: 20,
      goalLabel: "20 unbroken",
      history: [],
    },
    muscle_ups: {
      id: "muscle_ups",
      label: "Muscle-ups",
      category: "crossfit",
      metricType: "reps",
      unit: "reps",
      goal: 5,
      goalLabel: "5 unbroken",
      history: [],
    },
    hsw: {
      id: "hsw",
      label: "Handstand Walk",
      category: "crossfit",
      metricType: "metres",
      unit: "m",
      goal: 25,
      goalLabel: "25m",
      history: [],
    },
    freestanding_hspu: {
      id: "freestanding_hspu",
      label: "Freestanding HSPU",
      category: "crossfit",
      metricType: "reps",
      unit: "reps",
      goal: 3,
      goalLabel: "3 reps",
      history: [],
    },
    strict_hspu: {
      id: "strict_hspu",
      label: "Strict HSPU",
      category: "crossfit",
      metricType: "reps",
      unit: "reps",
      goal: 10,
      goalLabel: "10 strict",
      history: [],
    },
    swim_100m: {
      id: "swim_100m",
      label: "100m Freestyle",
      category: "swimming",
      metricType: "seconds",
      unit: "s",
      goal: 75,
      goalLabel: "Sub 1:15",
      history: [],
    },
    swim_200m: {
      id: "swim_200m",
      label: "200m Freestyle",
      category: "swimming",
      metricType: "seconds",
      unit: "s",
      goal: 180,
      goalLabel: "Sub 3:00",
      history: [],
    },
  },
};

export async function loadFitness(): Promise<FitnessStore> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return structuredClone(DEFAULT_STORE);

  const [{ data: liftsData }, { data: skillsData }] = await Promise.all([
    supabase.from("fitness_lifts").select("lift_id, goal, history").eq("user_id", user.id),
    supabase
      .from("fitness_skills")
      .select("skill_id, goal, goal_label, history")
      .eq("user_id", user.id),
  ]);

  const store = structuredClone(DEFAULT_STORE);

  for (const row of liftsData ?? []) {
    const id = row.lift_id as LiftId;
    if (store.lifts[id]) {
      store.lifts[id].goal = row.goal;
      store.lifts[id].history = (row.history ?? []) as PREntry[];
    }
  }

  for (const row of skillsData ?? []) {
    const id = row.skill_id as SkillId;
    if (store.skills[id]) {
      store.skills[id].goal = row.goal;
      store.skills[id].goalLabel = (row.goal_label ?? store.skills[id].goalLabel) as any;
      store.skills[id].history = (row.history ?? []) as PREntry[];
    }
  }

  return store;
}

export async function logPR(
  kind: "lift" | "skill",
  id: LiftId | SkillId,
  value: number,
  notes?: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const entry: PREntry = { value, date: todayISO(), notes };

  const table = kind === "lift" ? "fitness_lifts" : "fitness_skills";
  const idCol = kind === "lift" ? "lift_id" : "skill_id";

  const { data } = await supabase
    .from(table)
    .select("history")
    .eq("user_id", user.id)
    .eq(idCol, id)
    .maybeSingle();

  const history = [entry, ...(((data?.history as PREntry[]) ?? []) as PREntry[])];

  await supabase
    .from(table)
    .upsert({ user_id: user.id, [idCol]: id, history }, { onConflict: `user_id,${idCol}` });

  emit();
}

export async function updateGoal(
  kind: "lift" | "skill",
  id: LiftId | SkillId,
  goal: number,
  goalLabel?: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const table = kind === "lift" ? "fitness_lifts" : "fitness_skills";
  const idCol = kind === "lift" ? "lift_id" : "skill_id";

  const payload: Record<string, unknown> = { user_id: user.id, [idCol]: id, goal };
  if (goalLabel !== undefined) payload.goal_label = goalLabel;

  await supabase.from(table).upsert(payload, { onConflict: `user_id,${idCol}` });
  emit();
}

export async function deleteEntry(
  kind: "lift" | "skill",
  id: LiftId | SkillId,
  index: number
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const table = kind === "lift" ? "fitness_lifts" : "fitness_skills";
  const idCol = kind === "lift" ? "lift_id" : "skill_id";

  const { data } = await supabase
    .from(table)
    .select("history")
    .eq("user_id", user.id)
    .eq(idCol, id)
    .maybeSingle();

  const history = [...(((data?.history as PREntry[]) ?? []) as PREntry[])];
  history.splice(index, 1);

  await supabase
    .from(table)
    .upsert({ user_id: user.id, [idCol]: id, history }, { onConflict: `user_id,${idCol}` });

  emit();
}

export function currentBest(history: PREntry[]): number | null {
  if (!history.length) return null;
  return Math.max(...history.map((e) => e.value));
}

export function progressPct(best: number | null, goal: number): number {
  if (best === null || goal <= 0) return 0;
  return Math.min(Math.round((best / goal) * 100), 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers + streak + weekly split (LOCAL, no Supabase tables needed)
// ─────────────────────────────────────────────────────────────────────────────

export function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function toUTCDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function diffDays(aISO: string, bISO: string): number {
  const a = toUTCDate(aISO);
  const b = toUTCDate(bISO);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export type StreakState = {
  lastWorkoutISO: string | null;
  streak: number;
};

function streakKey(goalId: string) {
  return `daily-life:fitness:streak:${goalId}:v1`;
}

export function getStreak(goalId: string): StreakState {
  const base: StreakState = { lastWorkoutISO: null, streak: 0 };
  const parsed = readJson<Partial<StreakState> | null>(streakKey(goalId), null);
  if (!parsed) return base;
  return {
    lastWorkoutISO: typeof parsed.lastWorkoutISO === "string" ? parsed.lastWorkoutISO : null,
    streak: Number(parsed.streak ?? 0) || 0,
  };
}

export function setStreak(goalId: string, state: StreakState) {
  writeJson(streakKey(goalId), state);
  emit();
}

export function getMondayISO(d = new Date()) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

export type WeeklySplitState = {
  weekStartISO: string;
  doneByDay: Record<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun", boolean>;
};

function weeklySplitKey(goalId: string) {
  return `daily-life:fitness:weeklySplit:${goalId}:v1`;
}

export function getWeeklySplit(goalId: string): WeeklySplitState {
  const monday = getMondayISO(new Date());
  const base: WeeklySplitState = {
    weekStartISO: monday,
    doneByDay: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false },
  };

  const parsed = readJson<Partial<WeeklySplitState> | null>(weeklySplitKey(goalId), null);
  if (!parsed) return base;

  return {
    weekStartISO: typeof parsed.weekStartISO === "string" ? parsed.weekStartISO : base.weekStartISO,
    doneByDay: { ...base.doneByDay, ...(parsed.doneByDay ?? {}) },
  };
}

export function setWeeklySplit(goalId: string, state: WeeklySplitState) {
  writeJson(weeklySplitKey(goalId), state);
  emit();
}