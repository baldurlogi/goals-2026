import type {
  ActivityLevel,
  MacroTargets,
  Sex,
  UserProfile,
  WeeklySchedule,
} from "@/features/onboarding/profileStorage";
import { normalizeWeeklySchedule } from "@/features/onboarding/profileStorage";
import { DEFAULT_MODULES, type ModuleId } from "@/features/modules/modules";

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
  | "weekly_schedule"
  | "daily_reading_goal"
  | "enabled_modules"
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
  weekly_schedule: WeeklySchedule;
  daily_reading_goal: string;
  enabled_modules: ModuleId[];
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
    weekly_schedule: normalizeWeeklySchedule(p.weekly_schedule, p.default_schedule_view),
    daily_reading_goal: (p.daily_reading_goal ?? 20).toString(),
    enabled_modules: normalizeEnabledModules(p.enabled_modules),
  };
}

export function formToFullPatch(f: ProfileForm): EditableProfileFields {
  return {
    display_name: f.display_name.trim() || null,
    sex: f.sex,
    age: f.age ? Number(f.age) : null,
    weight_kg: f.weight_kg ? Number(f.weight_kg) : null,
    height_cm: f.height_cm ? Number(f.height_cm) : null,
    activity_level: f.activity_level,
    onboarding_done: true,
    macro_maintain: f.macro_maintain ?? null,
    macro_cut: f.macro_cut ?? null,
    weekly_schedule: normalizeWeeklySchedule(f.weekly_schedule, null),
    daily_reading_goal: Number(f.daily_reading_goal) || 20,
    enabled_modules: f.enabled_modules,
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
