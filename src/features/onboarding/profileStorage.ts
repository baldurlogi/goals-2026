import { supabase } from "@/lib/supabaseClient";

export type Sex            = "male" | "female";
export type ActivityLevel  = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type ScheduleView   = "wfh" | "office" | "weekend";

export type MacroTargets = {
  cal:     number;
  protein: number;
  carbs:   number;
  fat:     number;
};

export type UserProfile = {
  id:                   string;
  display_name:         string | null;
  weight_kg:            number | null;
  height_cm:            number | null;
  age:                  number | null;
  sex:                  Sex | null;
  activity_level:       ActivityLevel;
  onboarding_done:      boolean;
  macro_maintain:       MacroTargets | null;
  macro_cut:            MacroTargets | null;
  default_schedule_view: ScheduleView;
  daily_reading_goal:   number;
  /** Modules the user enabled during onboarding. null = legacy (show all). */
  enabled_modules:      string[] | null;
  tier:                 "free" | "pro" | "pro_max";
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary:   "Sedentary (desk job, little/no exercise)",
  light:       "Light (1-3 workouts/week)",
  moderate:    "Moderate (3-5 workouts/week)",
  active:      "Active (6-7 workouts/week)",
  very_active: "Very active (2x/day or physical job)",
};

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

/** Mifflin-St Jeor BMR → TDEE */
export function calculateTDEE(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: Sex,
  activity: ActivityLevel,
): number {
  const bmr =
    sex === "male"
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

/** Generate maintain + cut macro targets from profile */
export function calculateMacros(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: Sex,
  activity: ActivityLevel,
): { maintain: MacroTargets; cut: MacroTargets } {
  const tdee = calculateTDEE(weight_kg, height_cm, age, sex, activity);

  // Protein: 2g per kg bodyweight
  const protein = Math.round(weight_kg * 2);

  // Maintain
  const mCal   = tdee;
  const mFat   = Math.round((mCal * 0.27) / 9);
  const mCarbs = Math.round((mCal - protein * 4 - mFat * 9) / 4);

  // Cut: 400 kcal deficit, higher protein
  const cCal    = tdee - 400;
  const cProtein = Math.round(weight_kg * 2.2);
  const cFat    = Math.round((cCal * 0.25) / 9);
  const cCarbs  = Math.round((cCal - cProtein * 4 - cFat * 9) / 4);

  return {
    maintain: { cal: mCal,  protein,          carbs: Math.max(0, mCarbs), fat: mFat },
    cut:      { cal: cCal,  protein: cProtein, carbs: Math.max(0, cCarbs), fat: cFat },
  };
}

const CACHE_KEY = "cache:profile:v1";

export const PROFILE_CHANGED_EVENT = "profile:changed";

function emitProfileChanged() {
  window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
}

export function readProfileCache(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function loadProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  const profile = data as UserProfile;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
  } catch {
    return profile;
  }

  return profile;
}

export async function saveProfile(patch: Partial<Omit<UserProfile, "id">>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .upsert({ id: user.id, ...patch }, { onConflict: "id" });

  const cached = readProfileCache();
  if (cached) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...cached, ...patch }));
    } catch {
      return;
    }
  }

  emitProfileChanged();
}

export async function completeOnboarding(profile: Omit<UserProfile, "id" | "onboarding_done" | "tier">): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const macros = (profile.weight_kg && profile.height_cm && profile.age && profile.sex)
    ? calculateMacros(profile.weight_kg, profile.height_cm, profile.age, profile.sex, profile.activity_level)
    : null;

  await saveProfile({
    ...profile,
    macro_maintain:  macros?.maintain ?? null,
    macro_cut:       macros?.cut      ?? null,
    onboarding_done: true,
  });
}