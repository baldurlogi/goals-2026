import { Link } from "react-router-dom";
import { Target, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGoalsDashboard } from "../hooks/useGoalsDashboard";
import type { UpcomingItem } from "@/features/goals/goalUtils";

function GoalRow({
  goalEmoji,
  goalTitle,
  step,
  daysFromToday,
}: {
  goalEmoji: string;
  goalTitle: string;
  step: { label: string; idealFinish?: string };
  daysFromToday: number;
}) {
  const overdue = daysFromToday < 0;
  const badge =
    overdue
      ? `${Math.abs(daysFromToday)}d overdue`
      : daysFromToday === 0
      ? "today"
      : daysFromToday === 1
      ? "tomorrow"
      : `in ${daysFromToday}d`;

  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="mt-0.5 text-base leading-none">{goalEmoji}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-tight truncate">{step.label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground truncate">
          {goalTitle} · {step.idealFinish ?? "—"}
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
          overdue
            ? "bg-destructive/10 text-destructive"
            : daysFromToday === 0
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {badge}
      </span>
    </div>
  );
}

export function UpcomingGoalsCard() {
  const { previewItems, overdueCount, hasMore, extraCount, horizon, totalCount } =
    useGoalsDashboard();

  return (
    <Card className="relative overflow-hidden lg:col-span-5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-rose-500 via-pink-400 to-orange-400" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Upcoming goals
            </span>
          </div>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
              {overdueCount} overdue
            </Badge>
          )}
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Next <span className="font-semibold text-foreground">{horizon} days</span>
          {totalCount > 0 && (
            <span className="text-muted-foreground">
              {" "}· {totalCount} step{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </CardHeader>

      <CardContent className="pb-5">
        {previewItems.length === 0 ? (
          <div className="rounded-lg bg-muted/40 px-3 py-4 text-center">
            <p className="text-sm font-medium">All clear 🎉</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Nothing due in the next {horizon} days.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/50">
              {previewItems.map((it: UpcomingItem) => (
                <GoalRow
                  key={`${it.goalId}-${it.step.id}`}
                  goalEmoji={it.goalEmoji}
                  goalTitle={it.goalTitle}
                  step={it.step}
                  daysFromToday={it.daysFromToday}
                />
              ))}
            </div>

            {hasMore && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                +{extraCount} more on the Upcoming tab
              </p>
            )}
          </>
        )}

        <div className="flex justify-end pt-3">
          <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Link to="/daily-plan/upcoming">
              All goals <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}