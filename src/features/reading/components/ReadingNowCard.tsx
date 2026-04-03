import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReadingStats } from "../readingTypes";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pencil, Save, X } from "lucide-react";

export function ReadingNowCard({
  stats,
  onMarkCompleted,
  onReset,
  isEditing,
  isSaving,
  hasPendingChanges,
  onStartEditing,
  onSave,
  onCancel,
  currentPageValue,
  onCurrentPageChange,
  onSaveCurrentPage,
  currentPageDirty,
  titleValue,
  authorValue,
  totalPagesValue,
  dailyGoalValue,
  onTitleChange,
  onAuthorChange,
  onTotalPagesChange,
  onDailyGoalChange,
  controlsDisabled = false,
}: {
  stats: ReadingStats;
  onMarkCompleted: () => void;
  onReset: () => void;
  isEditing: boolean;
  isSaving: boolean;
  hasPendingChanges: boolean;
  onStartEditing: () => void;
  onSave: () => void;
  onCancel: () => void;
  currentPageValue: string;
  onCurrentPageChange: (value: string) => void;
  onSaveCurrentPage: () => void;
  currentPageDirty: boolean;
  titleValue: string;
  authorValue: string;
  totalPagesValue: string;
  dailyGoalValue: string;
  onTitleChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onTotalPagesChange: (value: string) => void;
  onDailyGoalChange: (value: string) => void;
  controlsDisabled?: boolean;
}) {
  const hasBook = !!stats.current.title;
  const pageControlsDisabled = controlsDisabled || isSaving || isEditing;

  return (
    <Card className="border-rose-200/60 dark:border-rose-900/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xl font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
              Now reading
            </div>
            <CardTitle className="mt-1 text-base leading-tight">
              {stats.current.title || "No book set"}
            </CardTitle>
            <div className="mt-1 text-sm text-muted-foreground">
              {stats.current.author}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-2xl font-semibold text-rose-600 dark:text-rose-400">
              {stats.pct}%
            </div>
            <div className="text-xs text-muted-foreground">done</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {stats.current.currentPage}</span>
          <span>{stats.current.totalPages} pages total</span>
        </div>

        <Progress value={stats.pct} className="h-2" />

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="reading-current-page" className="text-sm font-medium">
              Current page
            </Label>
            <span className="text-xs text-muted-foreground">
              Quick update
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="reading-current-page"
              value={currentPageValue}
              onChange={(event) => onCurrentPageChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !pageControlsDisabled && currentPageDirty) {
                  onSaveCurrentPage();
                }
              }}
              inputMode="numeric"
              placeholder="0"
              disabled={pageControlsDisabled}
              className="sm:max-w-[180px]"
            />
            <Button
              type="button"
              variant="outline"
              onClick={onSaveCurrentPage}
              disabled={pageControlsDisabled || !currentPageDirty}
              className="gap-2 sm:w-auto"
            >
              {isSaving && !isEditing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update page
                </>
              )}
            </Button>
          </div>
        </div>

        {isEditing ? (
          <>
            <Separator />

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reading-title">Current book</Label>
                  <Input
                    id="reading-title"
                    value={titleValue}
                    onChange={(event) => onTitleChange(event.target.value)}
                    placeholder="Atomic Habits"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reading-author">Author</Label>
                  <Input
                    id="reading-author"
                    value={authorValue}
                    onChange={(event) => onAuthorChange(event.target.value)}
                    placeholder="James Clear"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reading-total-pages">Total pages</Label>
                  <Input
                    id="reading-total-pages"
                    value={totalPagesValue}
                    onChange={(event) => onTotalPagesChange(event.target.value)}
                    inputMode="numeric"
                    placeholder="320"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reading-daily-goal">Daily goal (pages)</Label>
                  <Input
                    id="reading-daily-goal"
                    value={dailyGoalValue}
                    onChange={(event) => onDailyGoalChange(event.target.value)}
                    inputMode="numeric"
                    placeholder="10"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </>
        ) : null}

        <Separator />

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">Pages left</div>
            <div className="text-lg font-semibold tabular-nums">
              {stats.pagesLeft}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">Daily goal</div>
            <div className="text-lg font-semibold tabular-nums">
              {stats.dailyGoalPages}/day
            </div>
          </div>

          <div className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white tabular-nums">
            ~{stats.daysToFinishCurrent} days until completion
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2 pt-1">
          {isEditing ? (
            <>
              <Button
                onClick={onSave}
                disabled={isSaving || !hasPendingChanges}
                className="flex-1 gap-2 bg-rose-600 text-white hover:bg-rose-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save details
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={onCancel} disabled={isSaving} className="gap-2 text-muted-foreground">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={onMarkCompleted}
                disabled={!hasBook || controlsDisabled}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Mark as completed
              </Button>
              <Button
                variant="outline"
                onClick={onStartEditing}
                disabled={controlsDisabled}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit details
              </Button>
              <Button
                variant="ghost"
                onClick={onReset}
                disabled={controlsDisabled}
                className="text-muted-foreground"
              >
                Reset
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
