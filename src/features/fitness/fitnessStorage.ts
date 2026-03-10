import { supabase } from "@/lib/supabaseClient";

export const FITNESS_CHANGED_EVENT = "fitness:changed";
function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FITNESS_CHANGED_EVENT));
  }
}

// ── Core PR types ─────────────────────────────────────────────────────────────

export type MetricType = "kg" | "reps" | "metres" | "seconds" | "km" | "lbs";
export type PRCategory = "barbell" | "crossfit" | "swimming" | "cardio" | "custom";

export type PREntry = { value: number; date: string; notes?: string };

export type PRGoal = {
  id: string;
  label: string;
  unit: MetricType;
  goal: number;
  goalLabel: string;
  category: PRCategory;
  history: PREntry[];
  createdAt: string;
};

// ── Suggestions ───────────────────────────────────────────────────────────────

export type PRSuggestion = {
  id: string;
  label: string;
  unit: MetricType;
  defaultGoal: number;
  defaultGoalLabel: string;
  category: PRCategory;
};

export const PR_SUGGESTIONS: PRSuggestion[] = [
  { id: "bench_press",       label: "Bench Press",       unit: "kg",      defaultGoal: 100,  defaultGoalLabel: "100 kg",       category: "barbell"  },
  { id: "back_squat",        label: "Back Squat",         unit: "kg",      defaultGoal: 140,  defaultGoalLabel: "140 kg",       category: "barbell"  },
  { id: "deadlift",          label: "Deadlift",           unit: "kg",      defaultGoal: 180,  defaultGoalLabel: "180 kg",       category: "barbell"  },
  { id: "ohp",               label: "Overhead Press",     unit: "kg",      defaultGoal: 70,   defaultGoalLabel: "70 kg",        category: "barbell"  },
  { id: "power_clean",       label: "Power Clean",        unit: "kg",      defaultGoal: 90,   defaultGoalLabel: "90 kg",        category: "barbell"  },
  { id: "snatch",            label: "Snatch",             unit: "kg",      defaultGoal: 70,   defaultGoalLabel: "70 kg",        category: "barbell"  },
  { id: "front_squat",       label: "Front Squat",        unit: "kg",      defaultGoal: 120,  defaultGoalLabel: "120 kg",       category: "barbell"  },
  { id: "clean_and_jerk",    label: "Clean & Jerk",       unit: "kg",      defaultGoal: 100,  defaultGoalLabel: "100 kg",       category: "barbell"  },
  { id: "butterfly_pullups", label: "Butterfly Pull-ups", unit: "reps",    defaultGoal: 20,   defaultGoalLabel: "20 unbroken",  category: "crossfit" },
  { id: "muscle_ups",        label: "Muscle-ups",         unit: "reps",    defaultGoal: 5,    defaultGoalLabel: "5 unbroken",   category: "crossfit" },
  { id: "strict_hspu",       label: "Strict HSPU",        unit: "reps",    defaultGoal: 10,   defaultGoalLabel: "10 strict",    category: "crossfit" },
  { id: "freestanding_hspu", label: "Freestanding HSPU",  unit: "reps",    defaultGoal: 3,    defaultGoalLabel: "3 reps",       category: "crossfit" },
  { id: "hsw",               label: "Handstand Walk",     unit: "metres",  defaultGoal: 25,   defaultGoalLabel: "25m",          category: "crossfit" },
  { id: "double_unders",     label: "Double-Unders",      unit: "reps",    defaultGoal: 100,  defaultGoalLabel: "100 unbroken", category: "crossfit" },
  { id: "swim_100m",         label: "100m Freestyle",     unit: "seconds", defaultGoal: 75,   defaultGoalLabel: "Sub 1:15",     category: "swimming" },
  { id: "swim_200m",         label: "200m Freestyle",     unit: "seconds", defaultGoal: 180,  defaultGoalLabel: "Sub 3:00",     category: "swimming" },
  { id: "swim_400m",         label: "400m Freestyle",     unit: "seconds", defaultGoal: 420,  defaultGoalLabel: "Sub 7:00",     category: "swimming" },
  { id: "run_5k",            label: "5K Run",             unit: "seconds", defaultGoal: 1500, defaultGoalLabel: "Sub 25:00",    category: "cardio"   },
  { id: "run_10k",           label: "10K Run",            unit: "seconds", defaultGoal: 3300, defaultGoalLabel: "Sub 55:00",    category: "cardio"   },
  { id: "run_half",          label: "Half Marathon",      unit: "seconds", defaultGoal: 7200, defaultGoalLabel: "Sub 2h",       category: "cardio"   },
];

export const CATEGORY_LABELS: Record<PRCategory, string> = {
  barbell:  "🏋️ Barbell",
  crossfit: "🤸 CrossFit",
  swimming: "🏊 Swimming",
  cardio:   "🏃 Cardio",
  custom:   "⚡ Custom",
};

export const UNIT_OPTIONS: { value: MetricType; label: string }[] = [
  { value: "kg",      label: "kg (weight)"    },
  { value: "lbs",     label: "lbs (weight)"   },
  { value: "reps",    label: "reps"            },
  { value: "metres",  label: "metres"          },
  { value: "km",      label: "km (distance)"  },
  { value: "seconds", label: "seconds (time)" },
];

// ── Cache ─────────────────────────────────────────────────────────────────────

const PR_CACHE_KEY = "cache:fitness_prs:v1";

export function readPRCache(): PRGoal[] {
  try {
    const raw = localStorage.getItem(PR_CACHE_KEY);
    if (raw) return JSON.parse(raw) as PRGoal[];
  } catch { /* ignore */ }
  return [];
}

function writePRCache(goals: PRGoal[]): void {
  try { localStorage.setItem(PR_CACHE_KEY, JSON.stringify(goals)); } catch { /* ignore */ }
}

// ── Supabase CRUD ─────────────────────────────────────────────────────────────

export async function loadPRGoals(): Promise<PRGoal[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return readPRCache();

  const { data } = await supabase
    .from("fitness_prs")
    .select("pr_id, label, unit, goal, goal_label, category, history, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (data && data.length > 0) {
    const goals: PRGoal[] = data.map((row) => ({
      id:        row.pr_id,
      label:     row.label,
      unit:      row.unit as MetricType,
      goal:      row.goal,
      goalLabel: row.goal_label ?? `${row.goal} ${row.unit}`,
      category:  (row.category ?? "custom") as PRCategory,
      history:   (row.history ?? []) as PREntry[],
      createdAt: row.created_at ?? todayISO(),
    }));
    writePRCache(goals);
    return goals;
  }
  return readPRCache();
}

export async function addPRGoal(
  goal: Omit<PRGoal, "history" | "createdAt">
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("fitness_prs").insert({
    user_id:    user.id,
    pr_id:      goal.id,
    label:      goal.label,
    unit:       goal.unit,
    goal:       goal.goal,
    goal_label: goal.goalLabel,
    category:   goal.category,
    history:    [],
    created_at: todayISO(),
  });
  emit();
}

export async function updatePRGoal(
  id: string,
  patch: Partial<Pick<PRGoal, "goal" | "goalLabel" | "label">>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const payload: Record<string, unknown> = {};
  if (patch.goal      !== undefined) payload.goal       = patch.goal;
  if (patch.goalLabel !== undefined) payload.goal_label = patch.goalLabel;
  if (patch.label     !== undefined) payload.label      = patch.label;
  await supabase
    .from("fitness_prs")
    .update(payload)
    .eq("user_id", user.id)
    .eq("pr_id", id);
  emit();
}

export async function deletePRGoal(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("fitness_prs")
    .delete()
    .eq("user_id", user.id)
    .eq("pr_id", id);
  emit();
}

export async function logPREntry(
  id: string,
  value: number,
  notes?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const entry: PREntry = { value, date: todayISO(), notes };
  const { data } = await supabase
    .from("fitness_prs")
    .select("history")
    .eq("user_id", user.id)
    .eq("pr_id", id)
    .maybeSingle();

  const history = [entry, ...((data?.history as PREntry[]) ?? [])];
  await supabase
    .from("fitness_prs")
    .update({ history })
    .eq("user_id", user.id)
    .eq("pr_id", id);
  emit();
}

export async function deletePREntry(id: string, index: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("fitness_prs")
    .select("history")
    .eq("user_id", user.id)
    .eq("pr_id", id)
    .maybeSingle();

  const history = [...((data?.history as PREntry[]) ?? [])];
  history.splice(index, 1);
  await supabase
    .from("fitness_prs")
    .update({ history })
    .eq("user_id", user.id)
    .eq("pr_id", id);
  emit();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function currentBest(history: PREntry[]): number | null {
  if (!history.length) return null;
  return Math.max(...history.map((e) => e.value));
}

export function progressPct(best: number | null, goal: number): number {
  if (best === null || goal <= 0) return 0;
  return Math.min(Math.round((best / goal) * 100), 100);
}

export function fmtValue(value: number, unit: MetricType): string {
  if (unit === "seconds") {
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    const s = value % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return `${value} ${unit}`;
}

export function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toUTCDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function diffDays(aISO: string, bISO: string): number {
  const a = toUTCDate(aISO);
  const b = toUTCDate(bISO);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayISO(d);
}

// ── Weekly split (unchanged) ──────────────────────────────────────────────────

export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export const DAY_KEYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type DaySplit = { label: string; completedDate: string | null };

export type WeeklySplitConfig = {
  days: Record<DayKey, DaySplit>;
  streak: number;
  lastStreakDate: string | null;
};

export const DEFAULT_SPLIT_LABELS: Record<DayKey, string> = {
  Mon: "Push", Tue: "Pull", Wed: "Legs", Thu: "Rest", Fri: "Push", Sat: "Cardio", Sun: "Rest",
};

export function makeDefaultSplit(): WeeklySplitConfig {
  const days = {} as Record<DayKey, DaySplit>;
  for (const dk of DAY_KEYS) days[dk] = { label: DEFAULT_SPLIT_LABELS[dk], completedDate: null };
  return { days, streak: 0, lastStreakDate: null };
}

export function todayDayKey(): DayKey {
  const map: DayKey[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[new Date().getDay()];
}

const SPLIT_CACHE_KEY = "cache:fitness_split:v1";

export function readSplitCache(): WeeklySplitConfig {
  try {
    const raw = localStorage.getItem(SPLIT_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WeeklySplitConfig;
      for (const dk of DAY_KEYS) {
        if (!parsed.days[dk]) parsed.days[dk] = { label: DEFAULT_SPLIT_LABELS[dk], completedDate: null };
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return makeDefaultSplit();
}

function writeSplitCache(cfg: WeeklySplitConfig): void {
  try { localStorage.setItem(SPLIT_CACHE_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

export async function loadWeeklySplit(): Promise<WeeklySplitConfig> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return readSplitCache();

  const { data } = await supabase
    .from("fitness_weekly_split")
    .select("config")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data?.config) {
    const cfg = data.config as WeeklySplitConfig;
    for (const dk of DAY_KEYS) {
      if (!cfg.days[dk]) cfg.days[dk] = { label: DEFAULT_SPLIT_LABELS[dk], completedDate: null };
    }
    writeSplitCache(cfg);
    return cfg;
  }
  return readSplitCache();
}

export async function saveWeeklySplit(cfg: WeeklySplitConfig): Promise<void> {
  writeSplitCache(cfg);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("fitness_weekly_split")
    .upsert({ user_id: user.id, config: cfg }, { onConflict: "user_id" });
  emit();
}

export async function toggleDayCompletion(
  cfg: WeeklySplitConfig,
  day: DayKey
): Promise<WeeklySplitConfig> {
  const today = todayISO();
  const isToday = day === todayDayKey();
  const wasCompleted = cfg.days[day].completedDate === today;

  const updatedDays: Record<DayKey, DaySplit> = {
    ...cfg.days,
    [day]: { ...cfg.days[day], completedDate: wasCompleted ? null : today },
  };

  let { streak, lastStreakDate } = cfg;

  if (isToday) {
    if (!wasCompleted) {
      if (!lastStreakDate) {
        streak = 1;
      } else {
        const delta = diffDays(lastStreakDate, today);
        if (delta === 1) streak = streak + 1;
        else if (delta !== 0) streak = 1;
      }
      lastStreakDate = today;
    } else {
      if (lastStreakDate === today) {
        streak = Math.max(0, streak - 1);
        lastStreakDate = streak === 0 ? null : yesterdayISO();
      }
    }
  }

  const next: WeeklySplitConfig = { days: updatedDays, streak, lastStreakDate };
  await saveWeeklySplit(next);
  return next;
}

export async function updateDayLabel(
  cfg: WeeklySplitConfig,
  day: DayKey,
  label: string
): Promise<WeeklySplitConfig> {
  const next: WeeklySplitConfig = {
    ...cfg,
    days: { ...cfg.days, [day]: { ...cfg.days[day], label } },
  };
  await saveWeeklySplit(next);
  return next;
}