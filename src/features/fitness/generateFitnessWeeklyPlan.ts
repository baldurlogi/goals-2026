import { getAISystemContext } from "@/features/ai/buildAIContext";
import { loadRecentSleepRecoveryEntries } from "@/features/sleep/sleepStorage";
import { writeAIUsageCache } from "@/features/subscription/aiUsageCache";
import { getSupabaseFunctionUrl, supabase } from "@/lib/supabaseClient";
import { DAY_KEYS, REST_LABELS } from "./constants";
import { getWeekStartISO } from "./date";
import type {
  FitnessPlanningProfile,
  WorkoutPlanExercise,
  WorkoutPlanSession,
} from "./planningTypes";
import { loadWeeklySplit, todayDayKey } from "./weeklySplitStorage";

const EDGE_FN_URL = getSupabaseFunctionUrl("hyper-responder");

export type AIUsage = {
  prompts_used: number;
  monthly_limit: number;
  remaining: number;
  tier: string;
};

type AILimitPayload = {
  error: "monthly_limit_reached";
  message: string;
  tier: string;
  monthly_limit: number;
  prompts_used: number;
  upgrade_required: boolean;
};

export class AILimitError extends Error {
  tier: string;
  limit: number;

  constructor(payload: AILimitPayload) {
    super(payload.message);
    this.name = "AILimitError";
    this.tier = payload.tier;
    this.limit = payload.monthly_limit;
  }
}

export type GeneratedFitnessWeeklyPlan = {
  fitnessGoal: string | null;
  daysPerWeek: number | null;
  splitName: string | null;
  progressionNote: string | null;
  recoveryNote: string | null;
  sessions: WorkoutPlanSession[];
};

export async function generateFitnessWeeklyPlanFromAI(
  profile: FitnessPlanningProfile | null,
  weekStart = getWeekStartISO(),
): Promise<{ plan: GeneratedFitnessWeeklyPlan; usage: AIUsage }> {
  const session = await getSession();
  const [userContext, adherenceContext, recoveryContext] = await Promise.all([
    getPlannerAIContext(),
    buildRecentAdherenceContext(),
    buildRecentRecoveryContext(session.user.id),
  ]);

  const response = await fetch(EDGE_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      action: "fitness-plan",
      weekStart,
      userContext,
      adherenceContext,
      recoveryContext,
      fitnessProfile: profile
        ? {
            primaryGoal: profile.primaryGoal,
            trainingDaysPerWeek: profile.trainingDaysPerWeek,
            sessionMinutes: profile.sessionMinutes,
            trainingLocation: profile.trainingLocation,
            equipment: profile.equipment,
            experienceLevel: profile.experienceLevel,
            preferredMuscleGroups: profile.preferredMuscleGroups,
            exercisesToAvoid: profile.exercisesToAvoid,
            injuryNotes: profile.injuryNotes,
            fitnessNotes: profile.fitnessNotes,
          }
        : null,
    }),
  });

  const raw = await response.text();

  if (response.status === 429) {
    try {
      const payload = JSON.parse(raw) as AILimitPayload;
      if (payload.error === "monthly_limit_reached") {
        throw new AILimitError(payload);
      }
    } catch (error) {
      if (error instanceof AILimitError) throw error;
    }
  }

  if (!response.ok) {
    throw new Error(readEdgeFunctionError(response.status, raw));
  }

  let data: { plan?: unknown; usage?: unknown };
  try {
    data = JSON.parse(raw) as { plan?: unknown; usage?: unknown };
  } catch {
    throw new Error("AI planner returned invalid JSON.");
  }

  const usage = coerceAIUsage(data.usage);
  writeAIUsageCache(usage);

  return {
    plan: coerceGeneratedPlan(
      data.plan,
      profile,
    ),
    usage,
  };
}

async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in.");
  }

  return session;
}

async function getPlannerAIContext(): Promise<string> {
  try {
    return await getAISystemContext();
  } catch {
    return "";
  }
}

async function buildRecentAdherenceContext(): Promise<string> {
  try {
    const split = await loadWeeklySplit();
    const todayIndex = DAY_KEYS.indexOf(todayDayKey());
    const plannedDays = DAY_KEYS.filter((dayKey) =>
      isPlannedWorkoutLabel(split.days[dayKey].label),
    );
    const completedPlannedDays = plannedDays.filter(
      (dayKey) => split.days[dayKey].completedDate !== null,
    );
    const pastPlannedDays = plannedDays.filter(
      (dayKey) => DAY_KEYS.indexOf(dayKey) < todayIndex,
    );
    const missedPlannedDays = pastPlannedDays.filter(
      (dayKey) => split.days[dayKey].completedDate === null,
    );

    if (plannedDays.length === 0) {
      return "No planned workout days are set in the current weekly split, so recent adherence is unknown.";
    }

    const completedLabels = completedPlannedDays.map((dayKey) => {
      const label = split.days[dayKey].label.trim() || dayKey;
      return `${dayKey}: ${label}`;
    });

    const missedLabels = missedPlannedDays.map((dayKey) => {
      const label = split.days[dayKey].label.trim() || dayKey;
      return `${dayKey}: ${label}`;
    });

    const adherenceTier = classifyAdherence({
      plannedCount: plannedDays.length,
      completedCount: completedPlannedDays.length,
      pastPlannedCount: pastPlannedDays.length,
      missedCount: missedPlannedDays.length,
    });

    const parts = [
      `Recent workout adherence looks ${adherenceTier}.`,
      `Planned workout days this week: ${plannedDays.length}.`,
      `Completed planned sessions: ${completedPlannedDays.length}.`,
      `Current streak: ${split.streak} day(s).`,
    ];

    if (pastPlannedDays.length > 0) {
      parts.push(
        `Earlier planned sessions missed this week: ${missedPlannedDays.length}.`,
      );
    } else {
      parts.push("There are no earlier planned sessions to judge yet this week.");
    }

    if (completedLabels.length > 0) {
      parts.push(`Completed sessions: ${completedLabels.join(", ")}.`);
    }

    if (missedLabels.length > 0) {
      parts.push(`Missed earlier sessions: ${missedLabels.join(", ")}.`);
    }

    return parts.join(" ");
  } catch {
    return "Recent workout adherence is unavailable.";
  }
}

async function buildRecentRecoveryContext(userId: string): Promise<string> {
  try {
    const entries = await loadRecentSleepRecoveryEntries(userId, 7);
    const informativeEntries = entries.filter(
      (entry) =>
        entry.sleepDurationMinutes !== null ||
        entry.sleepQualityScore !== null ||
        entry.energyLevel !== null ||
        entry.recoveryScore !== null,
    );

    if (informativeEntries.length === 0) {
      return "Recent sleep and recovery context is unavailable.";
    }

    const durationValues = informativeEntries
      .map((entry) => entry.sleepDurationMinutes)
      .filter((value): value is number => value !== null);
    const qualityValues = informativeEntries
      .map((entry) => entry.sleepQualityScore)
      .filter((value): value is number => value !== null);
    const energyValues = informativeEntries.reduce<number[]>(
      (values, entry) => {
        if (entry.energyLevel !== null) {
          values.push(entry.energyLevel);
        }
        return values;
      },
      [],
    );
    const recoveryValues = informativeEntries
      .map((entry) => entry.recoveryScore)
      .filter((value): value is number => value !== null);
    const bedtimeValues = informativeEntries
      .map((entry) => parseClockMinutes(entry.bedtime))
      .filter((value): value is number => value !== null);

    const avgDurationMinutes = average(durationValues);
    const avgQuality = average(qualityValues);
    const avgEnergy = average(energyValues);
    const avgRecovery = average(recoveryValues);
    const latestEntry = informativeEntries[0];
    const consistencyLabel = describeBedtimeConsistency(bedtimeValues);
    const recoveryStatus = classifyRecoveryStatus({
      avgDurationMinutes,
      avgQuality,
      avgEnergy,
      avgRecovery,
    });
    const parts = [
      recoveryStatus === "unknown"
        ? "Recent sleep and recovery context is limited."
        : `Recent sleep and recovery look ${recoveryStatus}.`,
    ];

    if (avgDurationMinutes !== null) {
      parts.push(
        `Average recent sleep duration: ${formatDuration(avgDurationMinutes)}.`,
      );
    }

    if (avgQuality !== null) {
      parts.push(
        `Average sleep quality: ${Math.round(avgQuality)}/100.`,
      );
    }

    if (avgRecovery !== null) {
      parts.push(
        `Average recovery score: ${Math.round(avgRecovery)}/100.`,
      );
    }

    if (avgEnergy !== null) {
      parts.push(
        `Average wake energy: ${avgEnergy.toFixed(1)}/5.`,
      );
    }

    if (consistencyLabel !== null) {
      parts.push(`Bedtime consistency: ${consistencyLabel}.`);
    }

    if (latestEntry.sleepDurationMinutes !== null) {
      parts.push(
        `Most recent sleep duration: ${formatDuration(latestEntry.sleepDurationMinutes)}.`,
      );
    }

    if (latestEntry.energyLevel !== null) {
      parts.push(
        `Most recent wake energy: ${latestEntry.energyLevel}/5.`,
      );
    }

    return parts.join(" ");
  } catch {
    return "Recent sleep and recovery context is unavailable.";
  }
}

function isPlannedWorkoutLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return Boolean(normalized) && !REST_LABELS.has(normalized);
}

function classifyAdherence(input: {
  plannedCount: number;
  completedCount: number;
  pastPlannedCount: number;
  missedCount: number;
}): "strong" | "mixed" | "low" {
  const completedRatio =
    input.plannedCount > 0 ? input.completedCount / input.plannedCount : 0;
  const missedRatio =
    input.pastPlannedCount > 0 ? input.missedCount / input.pastPlannedCount : 0;

  if (
    completedRatio >= 0.75 &&
    (input.pastPlannedCount === 0 || missedRatio <= 0.25)
  ) {
    return "strong";
  }

  if (
    completedRatio < 0.5 ||
    (input.pastPlannedCount >= 2 && missedRatio >= 0.5)
  ) {
    return "low";
  }

  return "mixed";
}

function classifyRecoveryStatus(input: {
  avgDurationMinutes: number | null;
  avgQuality: number | null;
  avgEnergy: number | null;
  avgRecovery: number | null;
}): "solid" | "mixed" | "poor" | "unknown" {
  const hasSignal =
    input.avgDurationMinutes !== null ||
    input.avgQuality !== null ||
    input.avgEnergy !== null ||
    input.avgRecovery !== null;

  if (!hasSignal) return "unknown";

  const poorDuration =
    input.avgDurationMinutes !== null && input.avgDurationMinutes < 390;
  const poorQuality = input.avgQuality !== null && input.avgQuality < 55;
  const poorEnergy = input.avgEnergy !== null && input.avgEnergy < 2.7;
  const poorRecovery = input.avgRecovery !== null && input.avgRecovery < 50;

  if (poorDuration || poorQuality || poorEnergy || poorRecovery) {
    return "poor";
  }

  const solidDuration =
    input.avgDurationMinutes !== null && input.avgDurationMinutes >= 450;
  const solidQuality = input.avgQuality !== null && input.avgQuality >= 75;
  const solidEnergy = input.avgEnergy !== null && input.avgEnergy >= 3.8;
  const solidRecovery = input.avgRecovery !== null && input.avgRecovery >= 70;

  if (solidDuration || solidQuality || solidEnergy || solidRecovery) {
    return "solid";
  }

  return "mixed";
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function parseClockMinutes(value: string | null): number | null {
  if (!value) return null;

  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function describeBedtimeConsistency(values: number[]): string | null {
  if (values.length < 3) return null;

  let minSpan = Number.POSITIVE_INFINITY;
  const sorted = [...values].sort((left, right) => left - right);

  for (let index = 0; index < sorted.length; index += 1) {
    const start = sorted[index];
    const end = sorted[(index + sorted.length - 1) % sorted.length];
    const span =
      index === 0 ? end - start : end + 1440 - start;
    minSpan = Math.min(minSpan, span);
  }

  if (minSpan <= 45) return "very consistent";
  if (minSpan <= 90) return "fairly consistent";
  return "inconsistent";
}

function formatDuration(totalMinutes: number): string {
  const rounded = Math.max(1, Math.round(totalMinutes));
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function readEdgeFunctionError(status: number, raw: string): string {
  let message = `Workout planner failed (${status})`;

  try {
    const parsed = JSON.parse(raw) as {
      error?: string;
      details?: string;
      raw_text?: string;
    };

    if (parsed.error) {
      message = parsed.error;
      if (parsed.details) message += `: ${parsed.details}`;
      if (parsed.raw_text) message += `: ${parsed.raw_text}`;
    }
  } catch {
    if (raw) {
      message += `: ${raw}`;
    }
  }

  return message;
}

function coerceAIUsage(value: unknown): AIUsage {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      prompts_used: 1,
      monthly_limit: 10,
      remaining: 9,
      tier: "free",
    };
  }

  const record = value as Record<string, unknown>;

  return {
    prompts_used:
      typeof record.prompts_used === "number" ? record.prompts_used : 1,
    monthly_limit:
      typeof record.monthly_limit === "number" ? record.monthly_limit : 10,
    remaining:
      typeof record.remaining === "number" ? record.remaining : 9,
    tier:
      typeof record.tier === "string" && record.tier.trim()
        ? record.tier
        : "free",
  };
}

function coerceGeneratedPlan(
  value: unknown,
  profile: FitnessPlanningProfile | null,
): GeneratedFitnessWeeklyPlan {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const sessions = Array.isArray(record.sessions)
    ? record.sessions
        .map(coerceSession)
        .filter((session): session is WorkoutPlanSession => session !== null)
        .sort((left, right) => left.dayIndex - right.dayIndex)
    : [];

  const fallbackGoal = profile?.primaryGoal
    ? profile.primaryGoal.replaceAll("_", " ")
    : null;
  const fallbackDaysPerWeek =
    profile?.trainingDaysPerWeek ??
    (sessions.length > 0 ? sessions.length : null);

  return {
    fitnessGoal: coerceText(record.fitness_goal ?? record.fitnessGoal) ?? fallbackGoal,
    daysPerWeek: clampDaysPerWeek(
      coerceNumber(record.days_per_week ?? record.daysPerWeek) ??
        fallbackDaysPerWeek,
    ),
    splitName: coerceText(record.split_name ?? record.splitName),
    progressionNote: coerceText(
      record.progression_note ?? record.progressionNote,
    ),
    recoveryNote: coerceText(
      record.recovery_note ?? record.recoveryNote,
    ),
    sessions,
  };
}

function coerceSession(value: unknown): WorkoutPlanSession | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    dayIndex: clampDayIndex(
      coerceNumber(record.day_index ?? record.dayIndex) ?? 1,
    ),
    title: coerceText(record.title) ?? "Workout session",
    focus: coerceText(record.focus),
    exercises: Array.isArray(record.exercises)
      ? record.exercises
          .map(coerceExercise)
          .filter((exercise): exercise is WorkoutPlanExercise => exercise !== null)
      : [],
  };
}

function coerceExercise(value: unknown): WorkoutPlanExercise | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = coerceText(record.name);
  if (!name) return null;

  return {
    source:
      record.source === "exercisedb" ? "exercisedb" : "custom",
    externalExerciseId: coerceText(
      record.external_exercise_id ?? record.externalExerciseId,
    ),
    name,
    target: coerceText(record.target),
    equipment: coerceText(record.equipment),
    sets: coerceNumber(record.sets),
    reps: coerceText(record.reps),
    restSeconds: coerceNumber(
      record.rest_seconds ?? record.restSeconds,
    ),
    notes: coerceText(record.notes),
  };
}

function coerceText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function coerceNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : null;
}

function clampDayIndex(value: number): number {
  return Math.min(7, Math.max(1, value));
}

function clampDaysPerWeek(value: number | null): number | null {
  if (value === null) return null;
  return Math.min(7, Math.max(1, value));
}
