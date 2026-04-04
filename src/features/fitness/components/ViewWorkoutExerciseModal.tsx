import { ExternalLink, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExercisePreviewQuery } from "../useExerciseCatalogQuery";
import { ExerciseCatalogRequestError } from "../exerciseCatalogClient";
import type { WorkoutPlanExercise } from "../planningTypes";

type Props = {
  open: boolean;
  exercise: WorkoutPlanExercise | null;
  onClose: () => void;
};

function buildExternalImageLink(exerciseId: string): string {
  const params = new URLSearchParams({
    exerciseId,
    resolution: "360",
  });

  return `https://exercisedb.p.rapidapi.com/image?${params.toString()}`;
}

function buildExerciseDemoSearchLink(exerciseName: string): string {
  const params = new URLSearchParams({
    search_query: `${exerciseName} exercise demo`,
  });

  return `https://www.youtube.com/results?${params.toString()}`;
}

export function ViewWorkoutExerciseModal({
  open,
  exercise,
  onClose,
}: Props) {
  const previewQuery = useExercisePreviewQuery(
    {
      exerciseId: exercise?.externalExerciseId ?? null,
      query: exercise?.name ?? null,
      target: exercise?.target ?? null,
      equipment: exercise?.equipment ?? null,
      resolution: 180,
    },
    {
      enabled: open && Boolean(exercise?.externalExerciseId || exercise?.name),
    },
  );

  if (!open || !exercise) return null;

  const isRateLimited =
    previewQuery.error instanceof ExerciseCatalogRequestError &&
    previewQuery.error.code === "rate_limited";
  const resolvedExerciseId = previewQuery.data?.exercise?.externalExerciseId ??
    exercise.externalExerciseId;
  const demoSearchLink = buildExerciseDemoSearchLink(exercise.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div>
            <h2 className="text-base font-semibold">Exercise preview</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A quick visual reference so the movement feels easier to understand.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-y px-5 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">{exercise.name}</div>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {exercise.target ? <span>{exercise.target}</span> : null}
                {exercise.target && exercise.equipment ? <span>•</span> : null}
                {exercise.equipment ? <span>{exercise.equipment}</span> : null}
              </div>
            </div>

            <Badge variant="secondary">
              {previewQuery.data?.exercise?.source === "exercisedb" ||
                Boolean(exercise.externalExerciseId)
                ? "Linked demo"
                : "Planned movement"}
            </Badge>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {previewQuery.isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Loading exercise preview...
            </div>
          ) : previewQuery.isError ? (
            <div className="rounded-xl border border-dashed px-4 py-6 text-sm">
              <p className="font-medium">Couldn&apos;t load this exercise preview.</p>
              <p className="mt-1 text-muted-foreground">
                {previewQuery.error instanceof Error
                  ? previewQuery.error.message
                  : "Please try again."}
              </p>
              {isRateLimited ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  The Rapid free tier can throttle image requests too, so giving it a moment usually helps.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void previewQuery.refetch()}
                >
                  Try again
                </Button>
                {resolvedExerciseId ? (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                  >
                    <a
                      href={buildExternalImageLink(resolvedExerciseId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Open image endpoint
                    </a>
                  </Button>
                ) : null}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                >
                  <a
                    href={demoSearchLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Search demo
                  </a>
                </Button>
              </div>
            </div>
          ) : previewQuery.data ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border bg-muted/10">
                <img
                  src={previewQuery.data.dataUrl}
                  alt={exercise.name}
                  className="h-auto w-full object-contain"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This preview comes from ExerciseDB and is meant as a quick movement reference.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center">
              <p className="text-sm font-medium">No preview available right now</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The image response came back empty, so there isn&apos;t anything to show for this movement yet.
              </p>
              <Button asChild variant="ghost" size="sm" className="mt-3">
                <a
                  href={demoSearchLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Search demo
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
