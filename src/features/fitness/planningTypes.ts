export type FitnessExperienceLevel =
  | "beginner"
  | "intermediate"
  | "advanced";

export type FitnessPrimaryGoal =
  | "build_muscle"
  | "build_strength"
  | "lose_fat"
  | "general_fitness"
  | "endurance"
  | "athleticism"
  | "consistency";

export type FitnessTrainingLocation =
  | "gym"
  | "home"
  | "hybrid"
  | "outdoors";

export type FitnessPreferredSplit =
  | "full_body"
  | "upper_lower"
  | "push_pull_legs"
  | "custom";

export type WorkoutPlanStatus = "draft" | "active" | "archived";
export type WorkoutPlanSource = "ai" | "manual";
export type WorkoutPlanExerciseSource = "custom" | "exercisedb";

export type WorkoutPlanExercise = {
  source: WorkoutPlanExerciseSource;
  externalExerciseId: string | null;
  name: string;
  target: string | null;
  equipment: string | null;
  sets: number | null;
  reps: string | null;
  restSeconds: number | null;
  notes: string | null;
};

export type WorkoutPlanSession = {
  dayIndex: number;
  title: string;
  focus: string | null;
  exercises: WorkoutPlanExercise[];
};

export type FitnessPlanningProfile = {
  userId: string;
  primaryGoal: FitnessPrimaryGoal | null;
  experienceLevel: FitnessExperienceLevel | null;
  trainingDaysPerWeek: number | null;
  sessionMinutes: number | null;
  trainingLocation: FitnessTrainingLocation | null;
  equipment: string[];
  preferredSplit: FitnessPreferredSplit | null;
  preferredMuscleGroups: string[];
  exercisesToAvoid: string[];
  injuryNotes: string | null;
  fitnessNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FitnessPlanningProfileRow = {
  user_id: string;
  primary_goal: FitnessPrimaryGoal | null;
  experience_level: FitnessExperienceLevel | null;
  training_days_per_week: number | null;
  session_minutes: number | null;
  training_location: FitnessTrainingLocation | null;
  equipment: string[] | null;
  preferred_split: FitnessPreferredSplit | null;
  preferred_muscle_groups: string[] | null;
  exercises_to_avoid: string[] | null;
  injury_notes: string | null;
  fitness_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FitnessPlanningProfileInsert = {
  user_id: string;
  primary_goal?: FitnessPrimaryGoal | null;
  experience_level?: FitnessExperienceLevel | null;
  training_days_per_week?: number | null;
  session_minutes?: number | null;
  training_location?: FitnessTrainingLocation | null;
  equipment?: string[];
  preferred_split?: FitnessPreferredSplit | null;
  preferred_muscle_groups?: string[];
  exercises_to_avoid?: string[];
  injury_notes?: string | null;
  fitness_notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type FitnessPlanningProfileUpdate = Partial<
  Omit<FitnessPlanningProfileInsert, "user_id" | "created_at">
>;

export type FitnessWeeklyPlan = {
  userId: string;
  weekStart: string;
  fitnessGoal: string | null;
  daysPerWeek: number | null;
  splitName: string | null;
  progressionNote: string | null;
  recoveryNote: string | null;
  sessions: WorkoutPlanSession[];
  status: WorkoutPlanStatus;
  source: WorkoutPlanSource;
  createdAt: string;
  updatedAt: string;
};

export type FitnessWeeklyPlanRow = {
  user_id: string;
  week_start: string;
  fitness_goal: string | null;
  days_per_week: number | null;
  split_name: string | null;
  progression_note: string | null;
  recovery_note: string | null;
  sessions: unknown;
  status: WorkoutPlanStatus;
  source: WorkoutPlanSource;
  created_at: string;
  updated_at: string;
};

export type FitnessWeeklyPlanInsert = {
  user_id: string;
  week_start: string;
  fitness_goal?: string | null;
  days_per_week?: number | null;
  split_name?: string | null;
  progression_note?: string | null;
  recovery_note?: string | null;
  sessions?: WorkoutPlanSession[];
  status?: WorkoutPlanStatus;
  source?: WorkoutPlanSource;
  created_at?: string;
  updated_at?: string;
};

export type FitnessWeeklyPlanUpdate = Partial<
  Omit<FitnessWeeklyPlanInsert, "user_id" | "week_start" | "created_at">
>;

export function mapFitnessPlanningProfileRow(
  row: FitnessPlanningProfileRow,
): FitnessPlanningProfile {
  return {
    userId: row.user_id,
    primaryGoal: row.primary_goal,
    experienceLevel: row.experience_level,
    trainingDaysPerWeek: row.training_days_per_week,
    sessionMinutes: row.session_minutes,
    trainingLocation: row.training_location,
    equipment: Array.isArray(row.equipment) ? row.equipment : [],
    preferredSplit: row.preferred_split,
    preferredMuscleGroups: Array.isArray(row.preferred_muscle_groups)
      ? row.preferred_muscle_groups
      : [],
    exercisesToAvoid: Array.isArray(row.exercises_to_avoid)
      ? row.exercises_to_avoid
      : [],
    injuryNotes: row.injury_notes,
    fitnessNotes: row.fitness_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFitnessWeeklyPlanRow(
  row: FitnessWeeklyPlanRow,
): FitnessWeeklyPlan {
  return {
    userId: row.user_id,
    weekStart: row.week_start,
    fitnessGoal: row.fitness_goal,
    daysPerWeek: normalizeNullableInteger(row.days_per_week),
    splitName: row.split_name,
    progressionNote: row.progression_note,
    recoveryNote: row.recovery_note,
    sessions: normalizeWorkoutPlanSessions(row.sessions),
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createEmptyFitnessPlanningProfile(
  userId: string,
): FitnessPlanningProfile {
  const now = new Date().toISOString();

  return {
    userId,
    primaryGoal: null,
    experienceLevel: null,
    trainingDaysPerWeek: null,
    sessionMinutes: null,
    trainingLocation: null,
    equipment: [],
    preferredSplit: null,
    preferredMuscleGroups: [],
    exercisesToAvoid: [],
    injuryNotes: null,
    fitnessNotes: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyFitnessWeeklyPlan(
  userId: string,
  weekStart: string,
): FitnessWeeklyPlan {
  const now = new Date().toISOString();

  return {
    userId,
    weekStart,
    fitnessGoal: null,
    daysPerWeek: null,
    splitName: null,
    progressionNote: null,
    recoveryNote: null,
    sessions: [],
    status: "draft",
    source: "ai",
    createdAt: now,
    updatedAt: now,
  };
}

export function hasFitnessWeeklyPlanContent(
  plan: FitnessWeeklyPlan | null | undefined,
): boolean {
  return Boolean(plan && plan.sessions.length > 0);
}

function normalizeWorkoutPlanSessions(
  value: unknown,
): WorkoutPlanSession[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeWorkoutPlanSession).filter(
    (session): session is WorkoutPlanSession => session !== null,
  );
}

function normalizeWorkoutPlanSession(value: unknown): WorkoutPlanSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    dayIndex: normalizeDayIndex(record.dayIndex),
    title: normalizeRequiredText(record.title, "Workout session"),
    focus: normalizeNullableText(record.focus),
    exercises: Array.isArray(record.exercises)
      ? record.exercises
          .map(normalizeWorkoutPlanExercise)
          .filter(
            (exercise): exercise is WorkoutPlanExercise => exercise !== null,
          )
      : [],
  };
}

function normalizeWorkoutPlanExercise(
  value: unknown,
): WorkoutPlanExercise | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const source = normalizeExerciseSource(record.source);

  return {
    source,
    externalExerciseId: normalizeNullableText(
      record.externalExerciseId ?? record.external_exercise_id,
    ),
    name: normalizeRequiredText(record.name, "Exercise"),
    target: normalizeNullableText(record.target),
    equipment: normalizeNullableText(record.equipment),
    sets: normalizeNullableInteger(record.sets),
    reps: normalizeNullableText(record.reps),
    restSeconds: normalizeNullableInteger(
      record.restSeconds ?? record.rest_seconds,
    ),
    notes: normalizeNullableText(record.notes),
  };
}

function normalizeExerciseSource(value: unknown): WorkoutPlanExerciseSource {
  return value === "exercisedb" ? "exercisedb" : "custom";
}

function normalizeDayIndex(value: unknown): number {
  const normalized = normalizeNullableInteger(value);

  if (normalized === null) return 1;
  return Math.min(7, Math.max(1, normalized));
}

function normalizeNullableInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value);
}

function normalizeNullableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeRequiredText(value: unknown, fallback: string): string {
  return normalizeNullableText(value) ?? fallback;
}
