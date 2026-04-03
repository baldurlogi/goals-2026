import { useMemo, useState } from "react";
import {
  CalendarDays,
  Dumbbell,
  LoaderCircle,
  Moon,
  Repeat2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { formatWeekRange, getWeekStartISO } from "../date";
import {
  useFitnessPlanningProfileQuery,
  useCurrentFitnessWeeklyPlanState,
  useGenerateFitnessWeeklyPlanMutation,
  useSaveFitnessWeeklyPlanMutation,
} from "../useFitnessPlanningQuery";
import { AILimitError } from "../generateFitnessWeeklyPlan";
import { SwapWorkoutExerciseModal } from "./SwapWorkoutExerciseModal";
import type {
  FitnessPlanningProfile,
  FitnessWeeklyPlan,
  WorkoutPlanExercise,
} from "../planningTypes";
import type { ExerciseCatalogItem } from "../exerciseCatalogTypes";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatExercisePrescription(
  sets: number | null,
  reps: string | null,
  restSeconds: number | null,
): string {
  const parts = [
    typeof sets === "number" ? `${sets} sets` : null,
    reps ? `${reps} reps` : null,
    typeof restSeconds === "number" ? `${restSeconds}s rest` : null,
  ].filter(Boolean);

  return parts.join(" · ");
}

function dayLabel(dayIndex: number): string {
  return WEEKDAY_LABELS[Math.min(6, Math.max(0, dayIndex - 1))] ?? `Day ${dayIndex}`;
}

function buildFitReasons(
  profile: FitnessPlanningProfile | null | undefined,
  plan: FitnessWeeklyPlan | null,
): string[] {
  if (!plan) return [];

  const reasons: string[] = [];

  if (profile?.trainingDaysPerWeek) {
    reasons.push(
      `It matches your preference for ${profile.trainingDaysPerWeek} training day${profile.trainingDaysPerWeek === 1 ? "" : "s"} per week.`,
    );
  } else if (plan.daysPerWeek) {
    reasons.push(
      `It uses a manageable ${plan.daysPerWeek}-day structure to keep the week realistic.`,
    );
  }

  if (profile?.sessionMinutes) {
    reasons.push(
      `Sessions are designed to fit roughly into your ${profile.sessionMinutes}-minute training window.`,
    );
  }

  if (profile?.trainingLocation) {
    reasons.push(
      `Exercise choices are biased toward your ${profile.trainingLocation.replaceAll("_", " ")} setup.`,
    );
  }

  if (profile?.experienceLevel) {
    reasons.push(
      `The session structure is tuned for your ${profile.experienceLevel} experience level.`,
    );
  }

  if (profile?.preferredMuscleGroups.length) {
    reasons.push(
      `It gives extra attention to ${profile.preferredMuscleGroups.slice(0, 3).join(", ").toLowerCase()}.`,
    );
  }

  if (profile?.exercisesToAvoid.length || profile?.injuryNotes) {
    reasons.push(
      "It avoids movements that clash with your restrictions or exercises you want to skip.",
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      "It keeps the week balanced, practical, and easy to follow without assuming too much.",
    );
  }

  return reasons.slice(0, 4);
}

export function WeeklyWorkoutPlanCard() {
  const weekStart = getWeekStartISO();
  const weekRange = formatWeekRange();
  const profileQuery = useFitnessPlanningProfileQuery();
  const weeklyPlanState = useCurrentFitnessWeeklyPlanState();
  const saveWeeklyPlanMutation = useSaveFitnessWeeklyPlanMutation(weekStart);
  const generatePlanMutation = useGenerateFitnessWeeklyPlanMutation(
    weekStart,
    profileQuery.data ?? null,
  );
  const [swapTarget, setSwapTarget] = useState<{
    sessionIndex: number;
    exerciseIndex: number;
  } | null>(null);

  const plan = weeklyPlanState.plan;
  const hasPlan = weeklyPlanState.hasPlan;
  const totalExercises = plan?.sessions.reduce(
    (sum, session) => sum + session.exercises.length,
    0,
  ) ?? 0;
  const fitReasons = useMemo(
    () => buildFitReasons(profileQuery.data, plan),
    [plan, profileQuery.data],
  );
  const activeSwapExercise: WorkoutPlanExercise | null =
    swapTarget && plan?.sessions[swapTarget.sessionIndex]
      ? plan.sessions[swapTarget.sessionIndex].exercises[swapTarget.exerciseIndex] ?? null
      : null;
  const isProfileLight = useMemo(() => {
    const profile = profileQuery.data;
    if (!profile) return true;

    const signalCount = [
      profile.primaryGoal,
      profile.trainingDaysPerWeek,
      profile.sessionMinutes,
      profile.trainingLocation,
      profile.experienceLevel,
      profile.equipment.length > 0 ? "equipment" : null,
    ].filter(Boolean).length;

    return signalCount < 3;
  }, [profileQuery.data]);

  async function handleGenerate() {
    try {
      await generatePlanMutation.mutateAsync();
      toast.success(hasPlan ? "Weekly plan refreshed" : "Weekly plan generated");
    } catch (error) {
      if (error instanceof AILimitError) {
        toast.error(error.message);
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't generate your weekly workout plan.",
      );
    }
  }

  async function handleSwapExercise(candidate: ExerciseCatalogItem) {
    if (!plan || !swapTarget) return;

    const { sessionIndex, exerciseIndex } = swapTarget;
    const currentExercise =
      plan.sessions[sessionIndex]?.exercises[exerciseIndex] ?? null;

    if (!currentExercise) return;

    try {
      const nextSessions = plan.sessions.map((session, currentSessionIndex) => {
        if (currentSessionIndex !== sessionIndex) return session;

        return {
          ...session,
          exercises: session.exercises.map((exercise, currentExerciseIndex) => {
            if (currentExerciseIndex !== exerciseIndex) return exercise;

            return {
              ...exercise,
              source: "exercisedb" as const,
              externalExerciseId: candidate.externalExerciseId,
              name: candidate.name,
              target: candidate.target ?? exercise.target,
              equipment: candidate.equipment ?? exercise.equipment,
            };
          }),
        };
      });

      await saveWeeklyPlanMutation.mutateAsync({
        fitnessGoal: plan.fitnessGoal,
        daysPerWeek: plan.daysPerWeek,
        splitName: plan.splitName,
        progressionNote: plan.progressionNote,
        recoveryNote: plan.recoveryNote,
        sessions: nextSessions,
        status: plan.status,
        source: plan.source,
      });

      toast.success(`${currentExercise.name} swapped for ${candidate.name}`);
      setSwapTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't swap this exercise.",
      );
    }
  }

  return (
    <>
      <Card className="rounded-xl">
        <CardHeader className="px-4 pb-3 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                AI Weekly Workout Plan
              </CardTitle>
              <Badge variant={hasPlan ? "secondary" : "outline"} className="gap-1">
                <Sparkles className="h-3 w-3" />
                {hasPlan ? "Ready" : "Beta"}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {weekRange} · personalized from your profile, recent context, and available exercise candidates.
            </p>
          </div>

          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => void handleGenerate()}
            disabled={
              generatePlanMutation.isPending ||
              profileQuery.isLoading ||
              saveWeeklyPlanMutation.isPending
            }
          >
            {generatePlanMutation.isPending ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : hasPlan ? (
              <RefreshCw className="h-3.5 w-3.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {hasPlan ? "Regenerate plan" : "Generate plan"}
          </Button>
        </div>

        {isProfileLight && (
          <p className="mt-2 text-xs text-muted-foreground">
            Your planner works best with a fuller fitness profile. Update your settings above for tighter exercise choices.
          </p>
        )}
        </CardHeader>

        <CardContent className="space-y-4 px-4 pb-4">
        {weeklyPlanState.isPlanLoading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Loading weekly plan...
          </div>
        ) : weeklyPlanState.isError ? (
          <div className="rounded-xl border border-dashed px-4 py-6 text-sm">
            <p className="font-medium">Couldn&apos;t load the weekly plan.</p>
            <p className="mt-1 text-muted-foreground">
              {weeklyPlanState.error instanceof Error
                ? weeklyPlanState.error.message
                : "Please try again."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void weeklyPlanState.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : hasPlan && plan ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/20 px-3 py-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  Split
                </div>
                <div className="mt-1 text-sm font-medium">
                  {plan.splitName ?? "Custom weekly split"}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 px-3 py-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Goal
                </div>
                <div className="mt-1 text-sm font-medium">
                  {plan.fitnessGoal ?? "General fitness"}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 px-3 py-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Training days
                </div>
                <div className="mt-1 text-sm font-medium">
                  {plan.daysPerWeek ?? plan.sessions.length} / week
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {totalExercises} exercise{totalExercises === 1 ? "" : "s"} across the week
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/15 px-4 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-500" />
                <div className="text-sm font-semibold">Why this plan fits you</div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {fitReasons.map((reason) => (
                  <div
                    key={reason}
                    className="rounded-lg bg-background/70 px-3 py-2 text-sm text-muted-foreground"
                  >
                    {reason}
                  </div>
                ))}
              </div>
            </div>

            {(plan.progressionNote || plan.recoveryNote) && (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border bg-muted/15 px-3 py-3">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Progression
                  </div>
                  <p className="mt-1 text-sm">
                    {plan.progressionNote ?? "No progression note yet."}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/15 px-3 py-3">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <Moon className="h-3.5 w-3.5" />
                    Recovery
                  </div>
                  <p className="mt-1 text-sm">
                    {plan.recoveryNote ?? "No recovery note yet."}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border">
              <div className="px-4 py-3">
                <div className="text-sm font-semibold">Workout days</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Open each day to see focus, exercises, and the exact prescription.
                </p>
              </div>

              <Separator />

              <Accordion
                type="single"
                collapsible
                defaultValue={`day-${plan.sessions[0]?.dayIndex ?? 1}`}
                className="px-4"
              >
                {plan.sessions.map((session, sessionIndex) => (
                  <AccordionItem
                    key={`${session.dayIndex}-${session.title}`}
                    value={`day-${session.dayIndex}`}
                  >
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="shrink-0">
                            {dayLabel(session.dayIndex)}
                          </Badge>
                          <span className="truncate text-sm font-semibold">
                            {session.title}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {session.focus ? <span>{session.focus}</span> : null}
                          {session.focus ? <span>•</span> : null}
                          <span>
                            {session.exercises.length} exercise{session.exercises.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-4">
                      {session.exercises.map((exercise, index) => (
                        <div
                          key={`${session.dayIndex}-${exercise.name}-${exercise.externalExerciseId ?? "custom"}-${index}`}
                          className="rounded-xl border bg-muted/15 px-3 py-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">
                                {index + 1}. {exercise.name}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                {exercise.target ? <span>{exercise.target}</span> : null}
                                {exercise.target && exercise.equipment ? <span>•</span> : null}
                                {exercise.equipment ? <span>{exercise.equipment}</span> : null}
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {exercise.source === "exercisedb" ? "ExerciseDB" : "Custom"}
                            </Badge>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div className="rounded-lg bg-background/80 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Prescription
                              </div>
                              <div className="mt-1 text-sm font-medium">
                                {formatExercisePrescription(
                                  exercise.sets,
                                  exercise.reps,
                                  exercise.restSeconds,
                                ) || "Use listed guidance"}
                              </div>
                            </div>
                            <div className="rounded-lg bg-background/80 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Target
                              </div>
                              <div className="mt-1 text-sm font-medium">
                                {exercise.target ?? "General"}
                              </div>
                            </div>
                            <div className="rounded-lg bg-background/80 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Equipment
                              </div>
                              <div className="mt-1 text-sm font-medium">
                                {exercise.equipment ?? "As available"}
                              </div>
                            </div>
                          </div>

                          {exercise.notes && (
                            <p className="mt-3 text-xs text-muted-foreground">
                              {exercise.notes}
                            </p>
                          )}

                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() =>
                                setSwapTarget({
                                  sessionIndex,
                                  exerciseIndex: index,
                                })
                              }
                              disabled={
                                saveWeeklyPlanMutation.isPending ||
                                generatePlanMutation.isPending
                              }
                            >
                              <Repeat2 className="h-3.5 w-3.5" />
                              Swap exercise
                            </Button>
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {weeklyPlanState.isRefreshingPlan && (
              <p className="text-xs text-muted-foreground">
                Refreshing latest plan...
              </p>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium">No AI workout plan for this week yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Generate a plan to get a clear weekly split, day-by-day focus, exercise prescriptions, and simple progression guidance.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                onClick={() => void handleGenerate()}
                disabled={
                  generatePlanMutation.isPending ||
                  profileQuery.isLoading ||
                  saveWeeklyPlanMutation.isPending
                }
              >
                {generatePlanMutation.isPending ? (
                  <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                )}
                Generate weekly plan
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/app/fitness">Review profile</Link>
              </Button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      <SwapWorkoutExerciseModal
        open={Boolean(swapTarget && activeSwapExercise)}
        exercise={activeSwapExercise}
        onClose={() => setSwapTarget(null)}
        onSwap={(candidate) => void handleSwapExercise(candidate)}
        isSaving={saveWeeklyPlanMutation.isPending}
      />
    </>
  );
}
