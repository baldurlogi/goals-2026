import type {
  ActivityLevel,
  MacroTargets,
  WeeklySchedule,
  Sex,
} from "@/features/onboarding/profileStorage";
import { DEFAULT_WEEKLY_SCHEDULE } from "@/features/onboarding/profileStorage";
import type { ModuleId } from "@/features/modules/modules";

export type MacroSetupMode = "manual" | "guided";
export type NutritionGoalType =
  | "fat_loss"
  | "maintain"
  | "recomp"
  | "muscle_gain"
  | "performance"
  | "custom";

export type TrainingFocus = "lifting" | "mixed" | "endurance";
export type GoalPace = "gentle" | "moderate" | "aggressive";

export type OnboardingData = {
  display_name: string;
  sex: Sex;
  age: string;
  weight_kg: string;
  height_cm: string;
  activity_level: ActivityLevel;
  macro_maintain: MacroTargets | null;
  macro_cut: MacroTargets | null;
  macro_setup_mode: MacroSetupMode;
  nutrition_goal_type: NutritionGoalType;
  nutrition_goal_text: string;
  training_focus: TrainingFocus;
  goal_pace: GoalPace;
  known_maintenance_calories: string;
  weekly_schedule: WeeklySchedule;
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
  macro_setup_mode: "manual",
  nutrition_goal_type: "maintain",
  nutrition_goal_text: "",
  training_focus: "mixed",
  goal_pace: "moderate",
  known_maintenance_calories: "",
  weekly_schedule: { ...DEFAULT_WEEKLY_SCHEDULE },
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