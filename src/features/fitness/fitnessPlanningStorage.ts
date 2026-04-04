import { supabase } from "@/lib/supabaseClient";
import {
  createEmptyFitnessPlanningProfile,
  createEmptyFitnessWeeklyPlan,
  mapFitnessPlanningProfileRow,
  mapFitnessWeeklyPlanRow,
  type FitnessPlanningProfile,
  type FitnessPlanningProfileInsert,
  type FitnessPlanningProfileRow,
  type FitnessPlanningProfileUpdate,
  type FitnessWeeklyPlan,
  type FitnessWeeklyPlanInsert,
  type FitnessWeeklyPlanRow,
  type FitnessWeeklyPlanUpdate,
} from "./planningTypes";

const FITNESS_PLANNING_PROFILE_SELECT =
  "user_id, primary_goal, experience_level, training_days_per_week, session_minutes, training_location, equipment, preferred_split, preferred_muscle_groups, exercises_to_avoid, injury_notes, fitness_notes, created_at, updated_at";

const FITNESS_WEEKLY_PLAN_SELECT =
  "user_id, week_start, fitness_goal, days_per_week, split_name, progression_note, recovery_note, sessions, status, source, created_at, updated_at";

export async function loadFitnessPlanningProfile(
  userId: string,
): Promise<FitnessPlanningProfile> {
  const empty = createEmptyFitnessPlanningProfile(userId);

  const { data, error } = await supabase
    .from("fitness_planning_profiles")
    .select(FITNESS_PLANNING_PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Couldn't load your fitness planning profile.");
  }

  if (!data) return empty;

  return mapFitnessPlanningProfileRow(data as FitnessPlanningProfileRow);
}

export async function saveFitnessPlanningProfile(
  userId: string,
  patch: FitnessPlanningProfileUpdate,
): Promise<FitnessPlanningProfile> {
  const payload: FitnessPlanningProfileInsert = {
    user_id: userId,
    primary_goal: patch.primary_goal ?? null,
    experience_level: patch.experience_level ?? null,
    training_days_per_week: normalizeNullableInteger(
      patch.training_days_per_week,
    ),
    session_minutes: normalizeNullableInteger(patch.session_minutes),
    training_location: patch.training_location ?? null,
    equipment: normalizeEquipment(patch.equipment),
    preferred_split: patch.preferred_split ?? null,
    preferred_muscle_groups: normalizeStringArray(patch.preferred_muscle_groups),
    exercises_to_avoid: normalizeStringArray(patch.exercises_to_avoid),
    injury_notes: normalizeNullableText(patch.injury_notes),
    fitness_notes: normalizeNullableText(patch.fitness_notes),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("fitness_planning_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select(FITNESS_PLANNING_PROFILE_SELECT)
    .single();

  if (error) {
    throw new Error("Couldn't save your fitness planning profile.");
  }

  return mapFitnessPlanningProfileRow(data as FitnessPlanningProfileRow);
}

export async function loadFitnessWeeklyPlan(
  userId: string,
  weekStart: string,
): Promise<FitnessWeeklyPlan> {
  const empty = createEmptyFitnessWeeklyPlan(userId, weekStart);

  const { data, error } = await supabase
    .from("fitness_weekly_plans")
    .select(FITNESS_WEEKLY_PLAN_SELECT)
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) {
    throw new Error("Couldn't load your weekly workout plan.");
  }

  if (!data) return empty;

  return mapFitnessWeeklyPlanRow(data as FitnessWeeklyPlanRow);
}

export async function saveFitnessWeeklyPlan(
  userId: string,
  weekStart: string,
  patch: Pick<
    FitnessWeeklyPlanInsert,
    | "fitness_goal"
    | "days_per_week"
    | "split_name"
    | "progression_note"
    | "recovery_note"
    | "sessions"
  > &
    Pick<FitnessWeeklyPlanUpdate, "status" | "source">,
): Promise<FitnessWeeklyPlan> {
  const payload: FitnessWeeklyPlanInsert = {
    user_id: userId,
    week_start: weekStart,
    fitness_goal: normalizeNullableText(patch.fitness_goal),
    days_per_week: normalizeNullableInteger(patch.days_per_week),
    split_name: normalizeNullableText(patch.split_name),
    progression_note: normalizeNullableText(patch.progression_note),
    recovery_note: normalizeNullableText(patch.recovery_note),
    sessions: normalizeSessions(patch.sessions),
    status: patch.status ?? "draft",
    source: patch.source ?? "ai",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("fitness_weekly_plans")
    .upsert(payload, { onConflict: "user_id,week_start" })
    .select(FITNESS_WEEKLY_PLAN_SELECT)
    .single();

  if (error) {
    throw new Error("Couldn't save your weekly workout plan.");
  }

  return mapFitnessWeeklyPlanRow(data as FitnessWeeklyPlanRow);
}

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeNullableInteger(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value);
}

function normalizeEquipment(value: string[] | undefined) {
  return normalizeStringArray(value);
}

function normalizeStringArray(value: string[] | undefined) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => item.trim())
    .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index);
}

function normalizeSessions(value: FitnessWeeklyPlanUpdate["sessions"]) {
  return Array.isArray(value) ? value : [];
}
