import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReadingStats } from "../readingTypes";
import { BookMarked, Check, Loader2, Pencil, RotateCcw, Save, X } from "lucide-react";

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
  const progressOffset = 326 - (326 * stats.pct) / 100;
  const pagesPerDay = Math.max(1, stats.dailyGoalPages);
  const dailyLift = Math.min(100, Math.round((pagesPerDay / 45) * 100));

  return (
    <section className="ai-atmosphere ai-depth-stage ai-motion-enter-slow relative overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_18%_12%,rgba(245,158,11,0.16),transparent_30%),radial-gradient(circle_at_86%_4%,rgba(45,212,191,0.12),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.018))] px-4 py-5 shadow-[0_28px_90px_rgba(2,6,23,0.22)] sm:px-6 sm:py-6 lg:min-h-[620px]">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />

      <div className="relative flex min-h-[520px] flex-col justify-between gap-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/28 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
              <BookMarked className="h-3.5 w-3.5" />
              Reading ritual
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={titleValue}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder="Current book"
                  disabled={isSaving}
                  className="h-auto border-0 bg-transparent px-0 text-3xl font-semibold leading-tight shadow-none ring-0 placeholder:text-muted-foreground/45 focus-visible:ring-0 sm:text-4xl"
                />
                <Input
                  value={authorValue}
                  onChange={(event) => onAuthorChange(event.target.value)}
                  placeholder="Author"
                  disabled={isSaving}
                  className="h-auto border-0 bg-transparent px-0 text-base text-muted-foreground shadow-none ring-0 placeholder:text-muted-foreground/45 focus-visible:ring-0"
                />
              </div>
            ) : (
              <div>
                <h1 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                  {stats.current.title || "Choose the next idea worth living with"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stats.current.author || "A quiet place to turn curiosity into trajectory."}
                </p>
              </div>
            )}
          </div>

          <div className="relative hidden h-32 w-32 shrink-0 place-items-center sm:grid">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#reading-progress)"
                strokeDasharray="326"
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                strokeWidth="8"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="reading-progress" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#67e8f9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <div className="text-3xl font-semibold tabular-nums">{stats.pct}%</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                absorbed
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Page {stats.current.currentPage}</span>
              <span className="font-medium text-foreground/80">
                {stats.pagesLeft} left
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-background/42 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 shadow-[0_0_24px_rgba(52,211,153,0.32)] transition-all duration-700 ease-out"
                style={{ width: `${stats.pct}%` }}
              />
              <div className="absolute inset-0 animate-[ai-sheen_5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.35rem] bg-background/22 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.045)]">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Today's landing point
              </div>
              <div className="flex items-center gap-2">
                <Input
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
                  className="h-11 max-w-28 border-white/8 bg-background/30 text-lg font-semibold tabular-nums"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onSaveCurrentPage}
                  disabled={pageControlsDisabled || !currentPageDirty}
                  aria-label="Save current page"
                  className="h-11 w-11 rounded-full bg-background/30 text-emerald-200 hover:bg-background/50"
                >
                  {isSaving && !isEditing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-[1.35rem] bg-background/18 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035)]">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Momentum
              </div>
              <p className="text-sm font-medium">
                {stats.pct >= 80
                  ? "Closing arc"
                  : stats.pct >= 45
                    ? "Deep in the thread"
                    : stats.pct > 0
                      ? "Momentum building"
                      : "Ready to begin"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                ~{stats.daysToFinishCurrent} day{stats.daysToFinishCurrent === 1 ? "" : "s"} at this rhythm
              </p>
            </div>
          </div>

          {isEditing ? (
            <div className="grid gap-3 rounded-[1.5rem] bg-background/20 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.045)] sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Total pages
                </span>
                <Input
                  value={totalPagesValue}
                  onChange={(event) => onTotalPagesChange(event.target.value)}
                  inputMode="numeric"
                  placeholder="320"
                  disabled={isSaving}
                  className="border-white/8 bg-background/35"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Daily rhythm
                </span>
                <Input
                  value={dailyGoalValue}
                  onChange={(event) => onDailyGoalChange(event.target.value)}
                  inputMode="numeric"
                  placeholder="10"
                  disabled={isSaving}
                  className="border-white/8 bg-background/35"
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold tabular-nums">{stats.current.totalPages}</div>
                <div className="text-[10px] text-muted-foreground">pages</div>
              </div>
              <div>
                <div className="text-lg font-semibold tabular-nums">{stats.dailyGoalPages}/day</div>
                <div className="text-[10px] text-muted-foreground">rhythm</div>
              </div>
              <div>
                <div className="mx-auto mt-1 h-2 max-w-20 overflow-hidden rounded-full bg-background/45">
                  <div
                    className="h-full rounded-full bg-amber-300/80"
                    style={{ width: `${dailyLift}%` }}
                  />
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground">focus load</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                onClick={onSave}
                disabled={isSaving || !hasPendingChanges}
                className="gap-2 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={isSaving}
                className="h-10 rounded-full text-muted-foreground"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={onMarkCompleted}
                disabled={!hasBook || controlsDisabled}
                className="gap-2 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                <Check className="h-4 w-4" />
                Complete
              </Button>
              <Button
                variant="ghost"
                onClick={onStartEditing}
                disabled={controlsDisabled}
                className="h-10 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Tune
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={onReset}
            disabled={controlsDisabled || isEditing}
            className="h-9 rounded-full px-3 text-xs text-muted-foreground/70 hover:text-foreground"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>
    </section>
  );
}
