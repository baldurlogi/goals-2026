import { supabase } from "@/lib/supabaseClient";
import { FITNESS_CHANGED_EVENT } from "./constants";
import { todayISO } from "./date";
import type { MetricType, PREntry, PRCategory, PRGoal } from "./types";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import { clampNumberValue } from "@/lib/numericInput";
import {
  getActiveUserId,
  getScopedStorageItem,
  scopedKey,
} from "@/lib/activeUser";

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

export function readPRCache(
  userId: string | null = getActiveUserId(),
): PRGoal[] {
  try {
    const raw = getScopedStorageItem(PR_CACHE_KEY, userId);
    return raw ? (JSON.parse(raw) as PRGoal[]) : [];
  } catch {
    return [];
  }
}

function writePRCache(
  goals: PRGoal[],
  userId: string | null = getActiveUserId(),
): void {
  try {
    const key = prCacheKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(goals));
  } catch {
    // ignore
  }
}

export async function loadPRGoals(userId: string | null = getActiveUserId()): Promise<PRGoal[]> {
  if (!userId) return readPRCache();

  const { data, error } = await supabase
    .from("fitness_prs")
    .select(
      "pr_id, label, unit, goal, goal_label, category, history, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("loadPRGoals error:", error);
    return readPRCache();
  }

  const goals = (data ?? []).map(mapRowToGoal);
  writePRCache(goals, userId);
  return goals;
}

export async function addPRGoal(
  userIdOrGoal: string | Omit<PRGoal, "history" | "createdAt"> | null = getActiveUserId(),
  maybeGoal?: Omit<PRGoal, "history" | "createdAt">,
): Promise<void> {
  const userId = maybeGoal === undefined ? getActiveUserId() : userIdOrGoal as string | null;
  const goal = (maybeGoal === undefined ? userIdOrGoal : maybeGoal) as Omit<PRGoal, "history" | "createdAt">;
  if (!userId) return;

  const normalizedGoal =
    clampNumberValue(goal.goal, { min: 0.01, max: 100000, decimals: 2 }) ?? 0.01;

  const { error } = await supabase.from("fitness_prs").insert({
    user_id: userId,
    pr_id: goal.id,
    label: goal.label,
    unit: goal.unit,
    goal: normalizedGoal,
    goal_label: goal.goalLabel || `${normalizedGoal} ${goal.unit}`,
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
  userIdOrId: string | null = getActiveUserId(),
  idOrPatch?: string | Partial<Pick<PRGoal, "goal" | "goalLabel" | "label">>,
  maybePatch?: Partial<Pick<PRGoal, "goal" | "goalLabel" | "label">>,
): Promise<void> {
  const userId = maybePatch === undefined ? getActiveUserId() : userIdOrId as string | null;
  const id = (maybePatch === undefined ? userIdOrId : idOrPatch) as string;
  const patch = (maybePatch === undefined ? idOrPatch : maybePatch) as Partial<Pick<PRGoal, "goal" | "goalLabel" | "label">>;
  if (!userId) return;

  const payload: Record<string, unknown> = {};

  if (patch.goal !== undefined) {
    payload.goal =
      clampNumberValue(patch.goal, { min: 0.01, max: 100000, decimals: 2 }) ?? 0.01;
  }
  if (patch.goalLabel !== undefined) payload.goal_label = patch.goalLabel;
  if (patch.label !== undefined) payload.label = patch.label;

  const { error } = await supabase
    .from("fitness_prs")
    .update(payload)
    .eq("user_id", userId)
    .eq("pr_id", id);

  if (error) {
    console.warn("updatePRGoal error:", error);
    return;
  }

  emit();
}

export async function deletePRGoal(
  userIdOrId: string | null = getActiveUserId(),
  maybeId?: string,
): Promise<void> {
  const userId = maybeId === undefined ? getActiveUserId() : userIdOrId as string | null;
  const id = (maybeId === undefined ? userIdOrId : maybeId) as string;
  if (!userId) return;

  const { error } = await supabase
    .from("fitness_prs")
    .delete()
    .eq("user_id", userId)
    .eq("pr_id", id);

  if (error) {
    console.warn("deletePRGoal error:", error);
    return;
  }

  emit();
}

export async function logPREntry(
  userIdOrId: string | null = getActiveUserId(),
  idOrValue?: string | number,
  valueOrNotes?: number | string,
  maybeNotes?: string,
): Promise<void> {
  const userId = maybeNotes === undefined && typeof valueOrNotes !== "number" ? getActiveUserId() : userIdOrId as string | null;
  const id = (maybeNotes === undefined && typeof valueOrNotes !== "number" ? userIdOrId : idOrValue) as string;
  const value = (maybeNotes === undefined && typeof valueOrNotes !== "number" ? idOrValue : valueOrNotes) as number;
  const notes = (maybeNotes === undefined && typeof valueOrNotes !== "number" ? valueOrNotes : maybeNotes) as string | undefined;
  if (!userId) return;

  const normalizedValue =
    clampNumberValue(value, { min: 0.01, max: 100000, decimals: 2 }) ?? 0.01;

  const entry: PREntry = { value: normalizedValue, date: todayISO(), notes };

  const { data, error: loadError } = await supabase
    .from("fitness_prs")
    .select("history")
    .eq("user_id", userId)
    .eq("pr_id", id)
    .maybeSingle();

  if (loadError) {
    console.warn("logPREntry load error:", loadError);
    return;
  }

  const history = [entry, ...((data?.history ?? []) as PREntry[])];

  const { error: updateError } = await supabase
    .from("fitness_prs")
    .update({ history })
    .eq("user_id", userId)
    .eq("pr_id", id);

  if (updateError) {
    console.warn("logPREntry update error:", updateError);
    return;
  }

  emit();
}

export async function deletePREntry(
  userIdOrId: string | null = getActiveUserId(),
  idOrIndex?: string | number,
  maybeIndex?: number,
): Promise<void> {
  const userId = maybeIndex === undefined ? getActiveUserId() : userIdOrId as string | null;
  const id = (maybeIndex === undefined ? userIdOrId : idOrIndex) as string;
  const index = (maybeIndex === undefined ? idOrIndex : maybeIndex) as number;
  if (!userId) return;

  const { data, error: loadError } = await supabase
    .from("fitness_prs")
    .select("history")
    .eq("user_id", userId)
    .eq("pr_id", id)
    .maybeSingle();

  if (loadError) {
    console.warn("deletePREntry load error:", loadError);
    return;
  }

  const history = [...((data?.history ?? []) as PREntry[])];
  history.splice(index, 1);

  const { error: updateError } = await supabase
    .from("fitness_prs")
    .update({ history })
    .eq("user_id", userId)
    .eq("pr_id", id);

  if (updateError) {
    console.warn("deletePREntry update error:", updateError);
    return;
  }

  emit();
}
