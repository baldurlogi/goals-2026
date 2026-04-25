import type {
  ActivityLevel,
  MacroTargets,
  Sex,
  UserProfile,
  WeeklySchedule,
} from "@/features/onboarding/profileStorage";
import type { NutritionPhase } from "@/features/nutrition/nutritionData";
import { normalizeWeeklySchedule } from "@/features/onboarding/profileStorage";
import { DEFAULT_MODULES, type ModuleId } from "@/features/modules/modules";
import { clampNumberValue } from "@/lib/numericInput";
import type {
  DateFormatPreference,
  MeasurementSystem,
  TimeFormatPreference,
} from "@/lib/userPreferences";

export type EditableProfileFields = Pick<
  UserProfile,
  | "display_name"
  | "sex"
  | "age"
  | "weight_kg"
  | "height_cm"
  | "activity_level"
  | "onboarding_done"
  | "macro_maintain"
  | "macro_cut"
  | "macro_recomp"
  | "macro_muscle_gain"
  | "macro_performance"
  | "nutrition_goal_focuses"
  | "weekly_schedule"
  | "daily_reading_goal"
  | "enabled_modules"
  | "measurement_system"
  | "date_format"
  | "time_format"
>;

export type ProfileForm = {
  display_name: string;
  sex: Sex;
  age: string;
  weight_kg: string;
  height_cm: string;
  activity_level: ActivityLevel;
  macro_maintain: MacroTargets | null;
  macro_cut: MacroTargets | null;
  macro_recomp: MacroTargets | null;
  macro_muscle_gain: MacroTargets | null;
  macro_performance: MacroTargets | null;
  nutrition_goal_focuses: NutritionPhase[];
  weekly_schedule: WeeklySchedule;
  daily_reading_goal: string;
  enabled_modules: ModuleId[];
  measurement_system: MeasurementSystem;
  date_format: DateFormatPreference;
  time_format: TimeFormatPreference;
};

export function normalizeEnabledModules(
  value: UserProfile["enabled_modules"],
): ModuleId[] {
  return Array.isArray(value) && value.length > 0
    ? [...value]
    : [...DEFAULT_MODULES];
}

export function profileToForm(p: UserProfile): ProfileForm {
  return {
    display_name: p.display_name ?? "",
    sex: (p.sex ?? "male") as Sex,
    age: p.age?.toString() ?? "",
    weight_kg: p.weight_kg?.toString() ?? "",
    height_cm: p.height_cm?.toString() ?? "",
    activity_level: p.activity_level ?? "active",
    macro_maintain: p.macro_maintain ?? null,
    macro_cut: p.macro_cut ?? null,
    macro_recomp: p.macro_recomp ?? null,
    macro_muscle_gain: p.macro_muscle_gain ?? null,
    macro_performance: p.macro_performance ?? null,
    nutrition_goal_focuses: p.nutrition_goal_focuses ?? [],
    weekly_schedule: normalizeWeeklySchedule(p.weekly_schedule, p.default_schedule_view),
    daily_reading_goal: (p.daily_reading_goal ?? 20).toString(),
    enabled_modules: normalizeEnabledModules(p.enabled_modules),
    measurement_system: p.measurement_system,
    date_format: p.date_format,
    time_format: p.time_format,
  };
}

export function formToFullPatch(f: ProfileForm): EditableProfileFields {
  const normalizeMacros = (targets: MacroTargets | null): MacroTargets | null => {
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

  return {
    display_name: f.display_name.trim() || null,
    sex: f.sex,
    age: clampNumberValue(f.age, { min: 1, max: 100, integer: true }),
    weight_kg: clampNumberValue(f.weight_kg, { min: 1, max: 300 }),
    height_cm: clampNumberValue(f.height_cm, { min: 1, max: 220 }),
    activity_level: f.activity_level,
    onboarding_done: true,
    macro_maintain: normalizeMacros(f.macro_maintain),
    macro_cut: normalizeMacros(f.macro_cut),
    macro_recomp: normalizeMacros(f.macro_recomp),
    macro_muscle_gain: normalizeMacros(f.macro_muscle_gain),
    macro_performance: normalizeMacros(f.macro_performance),
    nutrition_goal_focuses: [...f.nutrition_goal_focuses],
    weekly_schedule: normalizeWeeklySchedule(f.weekly_schedule, null),
    daily_reading_goal:
      clampNumberValue(f.daily_reading_goal, { min: 1, max: 200, integer: true }) ?? 20,
    enabled_modules: f.enabled_modules,
    measurement_system: f.measurement_system,
    date_format: f.date_format,
    time_format: f.time_format,
  };
}

function shallowEqualJSON(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function diffPatch(
  original: EditableProfileFields,
  next: EditableProfileFields,
) {
  const patch: Partial<EditableProfileFields> = {};

  const setPatchValue = <K extends keyof EditableProfileFields>(
    key: K,
    value: EditableProfileFields[K],
  ) => {
    patch[key] = value;
  };

  for (const key of Object.keys(next) as Array<keyof EditableProfileFields>) {
    if (!shallowEqualJSON(original[key], next[key])) {
      setPatchValue(key, next[key]);
    }
  }

  return patch;
}
