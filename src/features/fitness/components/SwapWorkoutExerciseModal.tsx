import { X, RefreshCw, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExerciseSwapCandidatesQuery } from "../useExerciseCatalogQuery";
import { ExerciseCatalogRequestError } from "../exerciseCatalogClient";
import type { WorkoutPlanExercise } from "../planningTypes";
import type { ExerciseCatalogItem } from "../exerciseCatalogTypes";

type Props = {
  open: boolean;
  exercise: WorkoutPlanExercise | null;
  onClose: () => void;
  onSwap: (candidate: ExerciseCatalogItem) => void;
  isSaving?: boolean;
};

function formatCurrentExercise(exercise: WorkoutPlanExercise | null): string {
  if (!exercise) return "";

  return [
    exercise.target,
    exercise.equipment,
    typeof exercise.sets === "number" ? `${exercise.sets} sets` : null,
    exercise.reps ? `${exercise.reps} reps` : null,
    typeof exercise.restSeconds === "number"
      ? `${exercise.restSeconds}s rest`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function SwapWorkoutExerciseModal({
  open,
  exercise,
  onClose,
  onSwap,
  isSaving = false,
}: Props) {
  const swapQuery = useExerciseSwapCandidatesQuery(
    {
      currentExerciseId: exercise?.externalExerciseId ?? null,
      currentExerciseName: exercise?.name ?? null,
      target: exercise?.target ?? null,
      equipment: exercise?.equipment ?? null,
      limit: 6,
    },
    { enabled: open && Boolean(exercise) },
  );

  if (!open || !exercise) return null;

  const isRateLimited =
    swapQuery.error instanceof ExerciseCatalogRequestError &&
    swapQuery.error.code === "rate_limited";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl border bg-background shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div>
            <h2 className="text-base font-semibold">Swap exercise</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Replace just this movement while keeping the rest of your workout day intact.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-y px-5 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">{exercise.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatCurrentExercise(exercise)}
              </div>
            </div>

            <Badge variant="secondary">
              {exercise.source === "exercisedb"
                ? "Current: Linked demo"
                : "Current: Planned movement"}
            </Badge>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {swapQuery.isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Finding good replacements...
            </div>
          ) : swapQuery.isError ? (
            <div className="rounded-xl border border-dashed px-4 py-6 text-sm">
              <p className="font-medium">Couldn&apos;t load replacement options.</p>
              <p className="mt-1 text-muted-foreground">
                {swapQuery.error instanceof Error
                  ? swapQuery.error.message
                  : "Please try again."}
              </p>
              {isRateLimited ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  The RapidAPI free tier can throttle short bursts. Waiting a little
                  before retrying is usually enough.
                </p>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void swapQuery.refetch()}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {isRateLimited ? "Retry in a moment" : "Try again"}
              </Button>
            </div>
          ) : swapQuery.data && swapQuery.data.length > 0 ? (
            <div className="space-y-2">
              {swapQuery.data.map((candidate) => (
                <button
                  key={candidate.externalExerciseId}
                  type="button"
                  onClick={() => onSwap(candidate)}
                  disabled={isSaving}
                  className="flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{candidate.name}</div>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {candidate.target ? <span>{candidate.target}</span> : null}
                      {candidate.target && candidate.equipment ? <span>•</span> : null}
                      {candidate.equipment ? <span>{candidate.equipment}</span> : null}
                      {candidate.bodyPart ? (
                        <>
                          {(candidate.target || candidate.equipment) ? <span>•</span> : null}
                          <span>{candidate.bodyPart}</span>
                        </>
                      ) : null}
                    </div>
                    {candidate.instructions[0] && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                        {candidate.instructions[0]}
                      </p>
                    )}
                  </div>

                  <Badge variant="secondary" className="shrink-0">
                    ExerciseDB
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center">
              <p className="text-sm font-medium">No close replacements found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try regenerating the weekly plan if this exercise really doesn&apos;t fit your setup.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
