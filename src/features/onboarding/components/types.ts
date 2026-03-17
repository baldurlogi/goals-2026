import type {
  ActivityLevel,
  MacroTargets,
  ScheduleView,
  Sex,
} from "@/features/onboarding/profileStorage";
import type { ModuleId } from "@/features/modules/modules";

export type OnboardingData = {
  display_name: string;
  sex: Sex;
  age: string;
  weight_kg: string;
  height_cm: string;
  activity_level: ActivityLevel;
  macro_maintain: MacroTargets | null;
  macro_cut: MacroTargets | null;
  default_schedule_view: ScheduleView;
  daily_reading_goal: string;
  enabled_modules: ModuleId[];
  main_goal: string;
  goal_why: string;
};

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  display_name: "",
  sex: "male",
  age: "",
  weight_kg: "",
  height_cm: "",
  activity_level: "active",
  macro_maintain: null,
  macro_cut: null,
  default_schedule_view: "wfh",
  daily_reading_goal: "20",
  enabled_modules: ["goals"],
  main_goal: "",
  goal_why: "",
};

export function buildInitialAIPrompt(goal: string, why: string) {
  const trimmedGoal = goal.trim();
  const trimmedWhy = why.trim();

  if (!trimmedGoal) return "";
  if (!trimmedWhy) return trimmedGoal;

  return `${trimmedGoal}\n\nWhy this matters right now: ${trimmedWhy}`;
}
