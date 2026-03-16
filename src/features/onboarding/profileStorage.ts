import { supabase } from "@/lib/supabaseClient";
import type { ModuleId } from "@/features/modules/modules";

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type ScheduleView = "wfh" | "office" | "weekend";

export type MacroTargets = {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type UserProfile = {
  id: string;
  display_name: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  sex: Sex | null;
  activity_level: ActivityLevel;
  onboarding_done: boolean;
  macro_maintain: MacroTargets | null;
  macro_cut: MacroTargets | null;
  default_schedule_view: ScheduleView;
  daily_reading_goal: number;
  enabled_modules: ModuleId[] | null;
  tier: "free" | "pro" | "pro_max";
};

const LEGACY_CACHE_KEY = "cache:profile:v1";

function profileCacheKey(userId: string) {
  return `cache:profile:v2:${userId}`;
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little/no exercise)",
  light: "Light (1-3 workouts/week)",
  moderate: "Moderate (3-5 workouts/week)",
  active: "Active (6-7 workouts/week)",
  very_active: "Very active (2x/day or physical job)",
};

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

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

export function calculateMacros(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: Sex,
  activity: ActivityLevel,
): { maintain: MacroTargets; cut: MacroTargets } {
  const tdee = calculateTDEE(weight_kg, height_cm, age, sex, activity);

  const protein = Math.round(weight_kg * 2);

  const mCal = tdee;
  const mFat = Math.round((mCal * 0.27) / 9);
  const mCarbs = Math.round((mCal - protein * 4 - mFat * 9) / 4);

  const cCal = tdee - 400;
  const cProtein = Math.round(weight_kg * 2.2);
  const cFat = Math.round((cCal * 0.25) / 9);
  const cCarbs = Math.round((cCal - cProtein * 4 - cFat * 9) / 4);

  return {
    maintain: { cal: mCal, protein, carbs: Math.max(0, mCarbs), fat: mFat },
    cut: {
      cal: cCal,
      protein: cProtein,
      carbs: Math.max(0, cCarbs),
      fat: cFat,
    },
  };
}

export const PROFILE_CHANGED_EVENT = "profile:changed";
const emitProfileChanged = () =>
  window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));

const inFlightProfileLoads = new Map<string, Promise<UserProfile | null>>();

function defaultProfile(id: string): UserProfile {
  return {
    id,
    display_name: null,
    weight_kg: null,
    height_cm: null,
    age: null,
    sex: null,
    activity_level: "active",
    onboarding_done: false,
    macro_maintain: null,
    macro_cut: null,
    default_schedule_view: "wfh",
    daily_reading_goal: 20,
    enabled_modules: null,
    tier: "free",
  };
}

export function readProfileCache(userId?: string | null): UserProfile | null {
  if (!userId) return null;

  try {
    const raw = localStorage.getItem(profileCacheKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as UserProfile;
    return parsed.id === userId ? parsed : null;
  } catch {
    return null;
  }
}

export function clearProfileState(): void {
  inFlightProfileLoads.clear();
}

function writeProfileCache(profile: UserProfile) {
  try {
    localStorage.setItem(
      profileCacheKey(profile.id),
      JSON.stringify(profile),
    );
    localStorage.removeItem(LEGACY_CACHE_KEY);
  } catch (e) {
    console.warn("write cache failed", e);
  }
}

export async function loadProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    clearProfileState();
    return null;
  }

  const cached = readProfileCache(user.id);
  if (cached) {
    return cached;
  }

  const inFlight = inFlightProfileLoads.get(user.id);
  if (inFlight) {
    return inFlight;
  }

  const loadPromise = (async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) return null;

    const profile = data as UserProfile;
    writeProfileCache(profile);
    return profile;
  })();

  inFlightProfileLoads.set(user.id, loadPromise);

  try {
    return await loadPromise;
  } finally {
    inFlightProfileLoads.delete(user.id);
  }
}

export async function saveProfile(
  patch: Partial<Omit<UserProfile, "id">>,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...patch }, { onConflict: "id" });

  if (error) throw error;

  const cached = readProfileCache(user.id);
  const next = cached
    ? ({ ...cached, ...patch } as UserProfile)
    : ({ ...defaultProfile(user.id), ...patch } as UserProfile);

  writeProfileCache(next);
  inFlightProfileLoads.delete(user.id);
  emitProfileChanged();
}

export async function completeOnboarding(
  profile: Omit<UserProfile, "id" | "onboarding_done" | "tier">,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const macros =
    profile.weight_kg && profile.height_cm && profile.age && profile.sex
      ? calculateMacros(
          profile.weight_kg,
          profile.height_cm,
          profile.age,
          profile.sex,
          profile.activity_level,
        )
      : null;

  await saveProfile({
    ...profile,
    macro_maintain: macros?.maintain ?? null,
    macro_cut: macros?.cut ?? null,
    onboarding_done: true,
  });
}