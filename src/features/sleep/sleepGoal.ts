import type { ActivityLevel } from "@/features/onboarding/profileStorage";

type SleepGoalProfileLike = {
  sleep_goal_minutes?: number | null;
  age?: number | null;
  activity_level?: ActivityLevel | null;
};

export function normalizeSleepGoalMinutes(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  const rounded = Math.round(value / 15) * 15;
  return Math.min(16 * 60, Math.max(4 * 60, rounded));
}

export function getPersonalizedSleepGoalMinutes(
  profile: SleepGoalProfileLike | null | undefined,
): number {
  const manualGoal = normalizeSleepGoalMinutes(profile?.sleep_goal_minutes);
  if (manualGoal !== null) {
    return manualGoal;
  }

  let minutes = 8 * 60;

  if (typeof profile?.age === "number") {
    if (profile.age < 20) minutes = 9 * 60;
    else if (profile.age >= 65) minutes = 7.5 * 60;
  }

  switch (profile?.activity_level) {
    case "sedentary":
      minutes -= 30;
      break;
    case "active":
      minutes += 30;
      break;
    case "very_active":
      minutes += 45;
      break;
    default:
      break;
  }

  return Math.min(9 * 60, Math.max(7 * 60, Math.round(minutes / 15) * 15));
}

export function formatSleepGoalDuration(minutes: number): string {
  const normalized = Math.max(Math.round(minutes), 0);
  const hours = Math.floor(normalized / 60);
  const leftoverMinutes = normalized % 60;

  if (leftoverMinutes === 0) return `${hours}h`;
  if (hours === 0) return `${leftoverMinutes}m`;
  return `${hours}h ${leftoverMinutes}m`;
}
