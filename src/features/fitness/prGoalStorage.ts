import { supabase } from "@/lib/supabaseClient";
import { FITNESS_CHANGED_EVENT } from "./constants";
import { todayISO } from "./date";
import type { MetricType, PREntry, PRCategory, PRGoal } from "./types";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import { getActiveUserId, scopedKey } from "@/lib/activeUser";

const PR_CACHE_KEY = CACHE_KEYS.FITNESS_PRS;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FITNESS_CHANGED_EVENT));
  }
}

function mapRowToGoal(row: {
  pr_id: string;
  label: string;
  unit: string;
  goal: number;
  goal_label: string | null;
  category: string | null;
  history: unknown;
  created_at: string | null;
}): PRGoal {
  return {
    id: row.pr_id,
    label: row.label,
    unit: row.unit as MetricType,
    goal: row.goal,
    goalLabel: row.goal_label ?? `${row.goal} ${row.unit}`,
    category: (row.category ?? "custom") as PRCategory,
    history: Array.isArray(row.history) ? (row.history as PREntry[]) : [],
    createdAt: row.created_at ?? todayISO(),
  };
}

function prCacheKey(userId: string | null = getActiveUserId()) {
  return scopedKey(PR_CACHE_KEY, userId);
}

export function readPRCache(userId: string | null = getActiveUserId()): PRGoal[] {
  try {
    const raw = localStorage.getItem(prCacheKey(userId));
    return raw ? (JSON.parse(raw) as PRGoal[]) : [];
  } catch {
    return [];
  }
}

function writePRCache(goals: PRGoal[], userId: string | null = getActiveUserId()): void {
  try {
    const key = prCacheKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(goals));
  } catch {
    // ignore
  }
}

export async function loadPRGoals(): Promise<PRGoal[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return readPRCache();

  const { data, error } = await supabase
    .from("fitness_prs")
    .select("pr_id, label, unit, goal, goal_label, category, history, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("loadPRGoals error:", error);
    return readPRCache();
  }

  const goals = (data ?? []).map(mapRowToGoal);
  writePRCache(goals, user.id);
  return goals;
}

export async function addPRGoal(
  goal: Omit<PRGoal, "history" | "createdAt">,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("fitness_prs").insert({
    user_id: user.id,
    pr_id: goal.id,
    label: goal.label,
    unit: goal.unit,
    goal: goal.goal,
    goal_label: goal.goalLabel,
    category: goal.category,
    history: [],
    created_at: todayISO(),
  });

  if (error) {
    console.warn("addPRGoal error:", error);
    return;
  }

  emit();
}

export async function updatePRGoal(
  id: string,
  patch: Partial<Pick<PRGoal, "goal" | "goalLabel" | "label">>,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const payload: Record<string, unknown> = {};

  if (patch.goal !== undefined) payload.goal = patch.goal;
  if (patch.goalLabel !== undefined) payload.goal_label = patch.goalLabel;
  if (patch.label !== undefined) payload.label = patch.label;

  const { error } = await supabase
    .from("fitness_prs")
    .update(payload)
    .eq("user_id", user.id)
    .eq("pr_id", id);

  if (error) {
    console.warn("updatePRGoal error:", error);
    return;
  }

  emit();
}

export async function deletePRGoal(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("fitness_prs")
    .delete()
    .eq("user_id", user.id)
    .eq("pr_id", id);

  if (error) {
    console.warn("deletePRGoal error:", error);
    return;
  }

  emit();
}

export async function logPREntry(
  id: string,
  value: number,
  notes?: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const entry: PREntry = { value, date: todayISO(), notes };

  const { data, error: loadError } = await supabase
    .from("fitness_prs")
    .select("history")
    .eq("user_id", user.id)
    .eq("pr_id", id)
    .maybeSingle();

  if (loadError) {
    console.warn("logPREntry load error:", loadError);
    return;
  }

  const history = [entry, ...(((data?.history ?? []) as PREntry[]))];

  const { error: updateError } = await supabase
    .from("fitness_prs")
    .update({ history })
    .eq("user_id", user.id)
    .eq("pr_id", id);

  if (updateError) {
    console.warn("logPREntry update error:", updateError);
    return;
  }

  emit();
}

export async function deletePREntry(id: string, index: number): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error: loadError } = await supabase
    .from("fitness_prs")
    .select("history")
    .eq("user_id", user.id)
    .eq("pr_id", id)
    .maybeSingle();

  if (loadError) {
    console.warn("deletePREntry load error:", loadError);
    return;
  }

  const history = [...(((data?.history ?? []) as PREntry[]))];
  history.splice(index, 1);

  const { error: updateError } = await supabase
    .from("fitness_prs")
    .update({ history })
    .eq("user_id", user.id)
    .eq("pr_id", id);

  if (updateError) {
    console.warn("deletePREntry update error:", updateError);
    return;
  }

  emit();
}