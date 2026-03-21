import { supabase } from "@/lib/supabaseClient";
import {
  getActiveUserId,
  getScopedStorageItem,
  legacyScopedKey,
  writeScopedStorageItem,
} from "@/lib/activeUser";
import { CACHE_KEYS } from "@/lib/cacheRegistry";
import type { ModuleId } from "@/features/modules/modules";
import { clampNumberValue } from "@/lib/numericInput";

export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type LegacyScheduleView = "wfh" | "office" | "weekend";
export type WeeklyScheduleValue = "office" | "wfh" | "hybrid" | "off";
export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
export type WeeklySchedule = Record<WeekdayKey, WeeklyScheduleValue>;

export const WEEKDAY_ORDER: WeekdayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: "office",
  tuesday: "office",
  wednesday: "office",
  thursday: "office",
  friday: "office",
  saturday: "off",
  sunday: "off",
};

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
  default_schedule_view: LegacyScheduleView;
  weekly_schedule: WeeklySchedule;
  daily_reading_goal: number;
  enabled_modules: ModuleId[] | null;
  tier: "free" | "pro" | "pro_max";
};

const LEGACY_CACHE_KEY = "cache:profile:v1";
const PROFILE_CACHE_KEY = CACHE_KEYS.PROFILE;

export function mapLegacyScheduleToWeekly(
  legacy: LegacyScheduleView | null | undefined,
): WeeklySchedule {
  if (legacy === "wfh") {
    return {
      monday: "wfh",
      tuesday: "wfh",
      wednesday: "wfh",
      thursday: "wfh",
      friday: "wfh",
      saturday: "off",
      sunday: "off",
    };
  }

  if (legacy === "weekend") {
    return {
      monday: "hybrid",
      tuesday: "hybrid",
      wednesday: "hybrid",
      thursday: "hybrid",
      friday: "hybrid",
      saturday: "off",
      sunday: "off",
    };
  }

  return { ...DEFAULT_WEEKLY_SCHEDULE };
}

export function normalizeWeeklySchedule(
  weekly: Partial<Record<WeekdayKey, unknown>> | null | undefined,
  legacy: LegacyScheduleView | null | undefined,
): WeeklySchedule {
  const fallback = mapLegacyScheduleToWeekly(legacy);
  const next = { ...fallback } as WeeklySchedule;

  for (const day of WEEKDAY_ORDER) {
    const value = weekly?.[day];
    if (
      value === "office" ||
      value === "wfh" ||
      value === "hybrid" ||
      value === "off"
    ) {
      next[day] = value;
    }
  }

  return next;
}

export function deriveLegacyScheduleView(
  weekly: WeeklySchedule | null | undefined,
): LegacyScheduleView {
  if (!weekly) return "office";

  const weekdayValues = WEEKDAY_ORDER.slice(0, 5).map((day) => weekly[day]);
  const officeCount = weekdayValues.filter((v) => v === "office").length;
  const wfhCount = weekdayValues.filter((v) => v === "wfh").length;

  if (officeCount >= 3) return "office";
  if (wfhCount >= 3) return "wfh";
  return "weekend";
}

export function normalizeUserProfile(raw: UserProfile): UserProfile {
  const weeklySchedule = normalizeWeeklySchedule(
    (raw as UserProfile & { weekly_schedule?: WeeklySchedule | null }).weekly_schedule,
    raw.default_schedule_view,
  );

  return {
    ...raw,
    weekly_schedule: weeklySchedule,
    default_schedule_view: deriveLegacyScheduleView(weeklySchedule),
  };
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
const emitProfileChanged = () => window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));

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
    default_schedule_view: "office",
    weekly_schedule: { ...DEFAULT_WEEKLY_SCHEDULE },
    daily_reading_goal: 20,
    enabled_modules: null,
    tier: "free",
  };
}

export function readProfileCache(userId?: string | null): UserProfile | null {
  if (!userId) return null;

  try {
    const raw = getScopedStorageItem(PROFILE_CACHE_KEY, userId);
    if (!raw) return null;

    const parsed = normalizeUserProfile(JSON.parse(raw) as UserProfile);
    return parsed.id === userId ? parsed : null;
  } catch {
    return null;
  }
}

export function clearProfileState(): void {
  inFlightProfileLoads.clear();
}

type ProfileReadError = {
  code?: string | null;
  status?: number | null;
  message?: string | null;
};

function isPermissionOrAuthProfileError(error: unknown): boolean {
  const candidate = error as ProfileReadError | null;
  const message = candidate?.message?.toLowerCase?.() ?? "";
  const code = candidate?.code ?? null;
  const status = candidate?.status ?? null;

  return (
    status === 401 ||
    status === 403 ||
    code === "42501" ||
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("jwt") ||
    message.includes("not authenticated") ||
    message.includes("auth")
  );
}

function shouldFallbackToCachedProfile(error: unknown): boolean {
  if (isPermissionOrAuthProfileError(error)) return false;

  const candidate = error as ProfileReadError | null;
  const status = candidate?.status ?? null;
  const message = candidate?.message?.toLowerCase?.() ?? "";

  return (
    status === null ||
    status >= 500 ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("tempor")
  );
}

function writeProfileCache(profile: UserProfile) {
  try {
    writeScopedStorageItem(
      PROFILE_CACHE_KEY,
      profile.id,
      JSON.stringify(normalizeUserProfile(profile)),
    );
    localStorage.removeItem(legacyScopedKey(PROFILE_CACHE_KEY, profile.id));
    localStorage.removeItem(LEGACY_CACHE_KEY);
  } catch (e) {
    console.warn("write cache failed", e);
  }
}

export function seedProfileCache(userId: string | null): UserProfile | null {
  return readProfileCache(userId);
}

export async function loadProfile(
  userId: string | null = getActiveUserId(),
): Promise<UserProfile | null> {
  if (!userId) {
    clearProfileState();
    return null;
  }

  const inFlight = inFlightProfileLoads.get(userId);
  if (inFlight) {
    return inFlight;
  }

  const loadPromise = (async () => {
    const cached = readProfileCache(userId);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      if (cached && shouldFallbackToCachedProfile(error)) {
        if (import.meta.env.DEV) {
          console.warn("[profile] using cached profile after transient read failure", {
            userId,
            code: error.code,
            status: (error as ProfileReadError).status ?? null,
            message: error.message,
          });
        }
        return cached;
      }

      if (import.meta.env.DEV) {
        console.warn("[profile] profile read failed", {
          userId,
          code: error.code,
          status: (error as ProfileReadError).status ?? null,
          message: error.message,
          hadCachedProfile: Boolean(cached),
        });
      }

      throw error;
    }

    if (!data) {
      if (import.meta.env.DEV) {
        console.info("[profile] no profile row found for authenticated user", { userId });
      }
      return null;
    }

    const profile = normalizeUserProfile(data as UserProfile);
    writeProfileCache(profile);
    return profile;
  })();

  inFlightProfileLoads.set(userId, loadPromise);

  try {
    return await loadPromise;
  } finally {
    inFlightProfileLoads.delete(userId);
  }
}

export async function saveProfile(
  userId: string | null,
  patch: Partial<Omit<UserProfile, "id">>,
): Promise<UserProfile | null> {
  if (!userId) return null;

  const normalizeMacros = (targets: MacroTargets | null | undefined) => {
    if (!targets) return null;

    return {
      cal: clampNumberValue(targets.cal, { min: 0, max: 10000, integer: true }) ?? 0,
      protein:
        clampNumberValue(targets.protein, { min: 0, max: 1000, integer: true }) ?? 0,
      carbs:
        clampNumberValue(targets.carbs, { min: 0, max: 1000, integer: true }) ?? 0,
      fat: clampNumberValue(targets.fat, { min: 0, max: 1000, integer: true }) ?? 0,
    };
  };

  const normalizedPatch = { ...patch } as Partial<Omit<UserProfile, "id">>;
  if ("age" in normalizedPatch) {
    normalizedPatch.age = clampNumberValue(normalizedPatch.age, {
      min: 1,
      max: 100,
      integer: true,
    });
  }
  if ("weight_kg" in normalizedPatch) {
    normalizedPatch.weight_kg = clampNumberValue(normalizedPatch.weight_kg, {
      min: 1,
      max: 300,
    });
  }
  if ("height_cm" in normalizedPatch) {
    normalizedPatch.height_cm = clampNumberValue(normalizedPatch.height_cm, {
      min: 1,
      max: 220,
    });
  }
  if ("daily_reading_goal" in normalizedPatch) {
    normalizedPatch.daily_reading_goal =
      clampNumberValue(normalizedPatch.daily_reading_goal, {
        min: 1,
        max: 200,
        integer: true,
      }) ?? 20;
  }
  if ("macro_maintain" in normalizedPatch) {
    normalizedPatch.macro_maintain = normalizeMacros(
      normalizedPatch.macro_maintain,
    );
  }
  if ("macro_cut" in normalizedPatch) {
    normalizedPatch.macro_cut = normalizeMacros(normalizedPatch.macro_cut);
  }

  if (normalizedPatch.weekly_schedule) {
    normalizedPatch.weekly_schedule = normalizeWeeklySchedule(
      normalizedPatch.weekly_schedule,
      normalizedPatch.default_schedule_view,
    );
    normalizedPatch.default_schedule_view = deriveLegacyScheduleView(
      normalizedPatch.weekly_schedule,
    );
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...normalizedPatch }, { onConflict: "id" });

  if (error) throw error;

  const cached = readProfileCache(userId);
  const next = normalizeUserProfile(
    cached
      ? ({ ...cached, ...normalizedPatch } as UserProfile)
      : ({ ...defaultProfile(userId), ...normalizedPatch } as UserProfile),
  );

  writeProfileCache(next);
  inFlightProfileLoads.delete(userId);
  emitProfileChanged();
  return next;
}

export async function completeOnboarding(
  profile: Omit<UserProfile, "id" | "onboarding_done" | "tier" | "default_schedule_view">,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;

  if (!userId) {
    throw new Error("Not signed in");
  }

  await saveProfile(userId, {
    ...profile,
    macro_maintain: profile.macro_maintain ?? null,
    macro_cut: profile.macro_cut ?? null,
    onboarding_done: true,
  });
}
