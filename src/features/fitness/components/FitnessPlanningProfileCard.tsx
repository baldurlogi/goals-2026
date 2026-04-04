import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type FitnessExperienceLevel,
  type FitnessPlanningProfile,
  type FitnessPlanningProfileUpdate,
  type FitnessPreferredSplit,
  type FitnessPrimaryGoal,
  type FitnessTrainingLocation,
} from "../planningTypes";
import {
  useFitnessPlanningProfileQuery,
  useSaveFitnessPlanningProfileMutation,
} from "../useFitnessPlanningQuery";

type PlanningProfileForm = {
  primaryGoal: FitnessPrimaryGoal | "";
  trainingDaysPerWeek: string;
  sessionMinutes: string;
  trainingLocation: FitnessTrainingLocation | "";
  equipment: string[];
  experienceLevel: FitnessExperienceLevel | "";
  preferredSplit: FitnessPreferredSplit | "";
  preferredMuscleGroups: string[];
  exercisesToAvoidText: string;
  injuryNotes: string;
  fitnessNotes: string;
};

const PRIMARY_GOAL_OPTIONS: Array<{
  value: FitnessPrimaryGoal;
  label: string;
}> = [
  { value: "build_muscle", label: "Build muscle" },
  { value: "build_strength", label: "Build strength" },
  { value: "lose_fat", label: "Lose fat" },
  { value: "general_fitness", label: "General fitness" },
  { value: "endurance", label: "Endurance" },
  { value: "athleticism", label: "Athletic performance" },
  { value: "consistency", label: "Build consistency" },
];

const EXPERIENCE_OPTIONS: Array<{
  value: FitnessExperienceLevel;
  label: string;
}> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const TRAINING_LOCATION_OPTIONS: Array<{
  value: FitnessTrainingLocation;
  label: string;
}> = [
  { value: "gym", label: "Gym" },
  { value: "home", label: "Home" },
  { value: "hybrid", label: "Hybrid" },
  { value: "outdoors", label: "Outdoors" },
];

const PREFERRED_SPLIT_OPTIONS: Array<{
  value: FitnessPreferredSplit;
  label: string;
}> = [
  { value: "full_body", label: "Full body" },
  { value: "upper_lower", label: "Upper / lower" },
  { value: "push_pull_legs", label: "Push / pull / legs" },
  { value: "custom", label: "Custom" },
];

const EQUIPMENT_OPTIONS = [
  "Barbell",
  "Dumbbells",
  "Cable machine",
  "Bench",
  "Pull-up bar",
  "Machines",
  "Kettlebells",
  "Bands",
  "Bodyweight only",
] as const;

const MUSCLE_GROUP_OPTIONS = [
  "Chest",
  "Back",
  "Shoulders",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Arms",
  "Core",
  "Full body",
] as const;

function FieldLabel({
  children,
  hint,
}: {
  children: string;
  hint?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-sm font-medium">{children}</span>
      {hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

function TogglePill({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function toForm(profile: FitnessPlanningProfile): PlanningProfileForm {
  return {
    primaryGoal: profile.primaryGoal ?? "",
    trainingDaysPerWeek:
      profile.trainingDaysPerWeek === null
        ? ""
        : String(profile.trainingDaysPerWeek),
    sessionMinutes:
      profile.sessionMinutes === null ? "" : String(profile.sessionMinutes),
    trainingLocation: profile.trainingLocation ?? "",
    equipment: profile.equipment,
    experienceLevel: profile.experienceLevel ?? "",
    preferredSplit: profile.preferredSplit ?? "",
    preferredMuscleGroups: profile.preferredMuscleGroups,
    exercisesToAvoidText: profile.exercisesToAvoid.join("\n"),
    injuryNotes: profile.injuryNotes ?? "",
    fitnessNotes: profile.fitnessNotes ?? "",
  };
}

function normalizeStringList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function buildPatchFromForm(
  form: PlanningProfileForm,
): { patch?: FitnessPlanningProfileUpdate; error?: string } {
  const trainingDays =
    form.trainingDaysPerWeek.trim() === ""
      ? null
      : Number(form.trainingDaysPerWeek);
  const sessionMinutes =
    form.sessionMinutes.trim() === "" ? null : Number(form.sessionMinutes);

  if (
    trainingDays !== null &&
    (!Number.isInteger(trainingDays) || trainingDays < 1 || trainingDays > 7)
  ) {
    return { error: "Training days per week must be a whole number from 1 to 7." };
  }

  if (
    sessionMinutes !== null &&
    (!Number.isInteger(sessionMinutes) ||
      sessionMinutes < 15 ||
      sessionMinutes > 240)
  ) {
    return { error: "Session duration must be between 15 and 240 minutes." };
  }

  return {
    patch: {
      primary_goal: form.primaryGoal || null,
      experience_level: form.experienceLevel || null,
      training_days_per_week: trainingDays,
      session_minutes: sessionMinutes,
      training_location: form.trainingLocation || null,
      equipment: form.equipment,
      preferred_split: form.preferredSplit || null,
      preferred_muscle_groups: form.preferredMuscleGroups,
      exercises_to_avoid: normalizeStringList(form.exercisesToAvoidText),
      injury_notes: form.injuryNotes.trim() || null,
      fitness_notes: form.fitnessNotes.trim() || null,
    },
  };
}

function formsEqual(left: PlanningProfileForm, right: PlanningProfileForm) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function FitnessPlanningProfileCard() {
  const profileQuery = useFitnessPlanningProfileQuery();
  const saveMutation = useSaveFitnessPlanningProfileMutation();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = profileQuery.data;

  const [form, setForm] = useState<PlanningProfileForm | null>(
    profile ? toForm(profile) : null,
  );

  const hydrationKey = profile
    ? `${profile.userId}:${profile.updatedAt}`
    : "empty";

  useEffect(() => {
    if (!profile) return;
    setForm(toForm(profile));
    setSaved(false);
    setError(null);
  }, [hydrationKey, profile]);

  const savedForm = useMemo(() => (profile ? toForm(profile) : null), [profile]);
  const isDirty = form && savedForm ? !formsEqual(form, savedForm) : false;

  function update(patch: Partial<PlanningProfileForm>) {
    setSaved(false);
    setError(null);
    setForm((current) => (current ? { ...current, ...patch } : current));
  }

  function toggleArrayValue(
    values: string[],
    nextValue: string,
  ): string[] {
    return values.includes(nextValue)
      ? values.filter((item) => item !== nextValue)
      : [...values, nextValue];
  }

  async function handleSave() {
    if (!form) return;

    const built = buildPatchFromForm(form);
    if (!built.patch) {
      setError(built.error ?? "Please review the form.");
      toast.error(built.error ?? "Please review the form.");
      return;
    }

    setError(null);

    try {
      await saveMutation.mutateAsync(built.patch);
      setSaved(true);
      toast.success("Workout planning settings saved");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Couldn't save workout planning settings.";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-violet-500" />
          AI workout planning profile
        </CardTitle>
        <CardDescription>
          Save the preferences and constraints your future AI workout planner
          should use each week.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {profileQuery.isLoading && !form ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading workout planning settings...
          </div>
        ) : null}

        {profileQuery.isError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {profileQuery.error instanceof Error
              ? profileQuery.error.message
              : "Couldn't load workout planning settings."}
          </div>
        ) : null}

        {form ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel hint="This gives the AI planner a clear priority.">
                  Primary fitness goal
                </FieldLabel>
                <select
                  value={form.primaryGoal}
                  onChange={(event) =>
                    update({
                      primaryGoal: event.target.value as FitnessPrimaryGoal | "",
                    })
                  }
                  disabled={saveMutation.isPending}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-[3px]"
                >
                  <option value="">Choose a goal</option>
                  {PRIMARY_GOAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <FieldLabel hint="Where most workouts happen right now.">
                  Training location
                </FieldLabel>
                <select
                  value={form.trainingLocation}
                  onChange={(event) =>
                    update({
                      trainingLocation:
                        event.target.value as FitnessTrainingLocation | "",
                    })
                  }
                  disabled={saveMutation.isPending}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-[3px]"
                >
                  <option value="">Choose a location</option>
                  {TRAINING_LOCATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <FieldLabel>Training days / week</FieldLabel>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="3"
                  value={form.trainingDaysPerWeek}
                  onChange={(event) =>
                    update({ trainingDaysPerWeek: event.target.value })
                  }
                  disabled={saveMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Session duration</FieldLabel>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="60"
                  value={form.sessionMinutes}
                  onChange={(event) =>
                    update({ sessionMinutes: event.target.value })
                  }
                  disabled={saveMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Experience level</FieldLabel>
                <select
                  value={form.experienceLevel}
                  onChange={(event) =>
                    update({
                      experienceLevel:
                        event.target.value as FitnessExperienceLevel | "",
                    })
                  }
                  disabled={saveMutation.isPending}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-[3px]"
                >
                  <option value="">Choose a level</option>
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <FieldLabel>Preferred split</FieldLabel>
                <select
                  value={form.preferredSplit}
                  onChange={(event) =>
                    update({
                      preferredSplit:
                        event.target.value as FitnessPreferredSplit | "",
                    })
                  }
                  disabled={saveMutation.isPending}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-[3px]"
                >
                  <option value="">No preference</option>
                  {PREFERRED_SPLIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel hint="Choose what the planner can reliably work with.">
                Available equipment
              </FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {EQUIPMENT_OPTIONS.map((option) => (
                  <TogglePill
                    key={option}
                    label={option}
                    active={form.equipment.includes(option)}
                    onClick={() =>
                      update({
                        equipment: toggleArrayValue(form.equipment, option),
                      })
                    }
                    disabled={saveMutation.isPending}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel hint="Optional focus areas if you want the plan to bias toward them.">
                Preferred muscle groups
              </FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_GROUP_OPTIONS.map((option) => (
                  <TogglePill
                    key={option}
                    label={option}
                    active={form.preferredMuscleGroups.includes(option)}
                    onClick={() =>
                      update({
                        preferredMuscleGroups: toggleArrayValue(
                          form.preferredMuscleGroups,
                          option,
                        ),
                      })
                    }
                    disabled={saveMutation.isPending}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel hint="One item per line works well. These become clear avoid rules for the AI.">
                Exercises to avoid
              </FieldLabel>
              <Textarea
                className="min-h-[96px]"
                placeholder={"Behind-the-neck press\nUpright rows"}
                value={form.exercisesToAvoidText}
                onChange={(event) =>
                  update({ exercisesToAvoidText: event.target.value })
                }
                disabled={saveMutation.isPending}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel hint="Injuries, pain triggers, or movement restrictions the planner should respect.">
                  Injury / restriction notes
                </FieldLabel>
                <Textarea
                  className="min-h-[120px]"
                  placeholder="Lower-back flare-ups with heavy deadlifts. Keep overhead volume moderate."
                  value={form.injuryNotes}
                  onChange={(event) =>
                    update({ injuryNotes: event.target.value })
                  }
                  disabled={saveMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel hint="Anything else that helps the planner personalize your week.">
                  Fitness notes
                </FieldLabel>
                <Textarea
                  className="min-h-[120px]"
                  placeholder="I prefer simple plans, enjoy supersets, and want legs earlier in the week."
                  value={form.fitnessNotes}
                  onChange={(event) =>
                    update({ fitnessNotes: event.target.value })
                  }
                  disabled={saveMutation.isPending}
                />
              </div>
            </div>

            {(error || saved) && (
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  error
                    ? "border-destructive/20 bg-destructive/5 text-destructive"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300",
                )}
              >
                {error ? (
                  error
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Workout planning settings saved.
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => void handleSave()}
                disabled={!isDirty || saveMutation.isPending}
                className="min-w-32 gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {saveMutation.isPending ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
