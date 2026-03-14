import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReadingStats } from "../readingTypes";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export function ReadingNowCard({
  stats,
  onMarkCompleted,
  onReset,
}: {
  stats: ReadingStats;
  onMarkCompleted: () => void;
  onReset: () => void;
}) {
  const hasBook = !!stats.current.title;

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
            ~{stats.daysToFinishCurrent} days
          </div>
        </div>

        <Separator />

        <div className="flex gap-2 pt-1">
          <Button
            onClick={onMarkCompleted}
            disabled={!hasBook}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Mark as completed
          </Button>
          <Button variant="ghost" onClick={onReset} className="text-muted-foreground">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}