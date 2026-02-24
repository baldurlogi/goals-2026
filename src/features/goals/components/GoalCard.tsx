import { Link } from "react-router-dom";
import type { GoalDefinition } from "../goalTypes";
import { getGoalProgress } from "../goalUtils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const PRIORITY_COLOR: Record<string, string> = {
  high:   "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low:    "bg-muted text-muted-foreground",
};

type Props = {
  goal: GoalDefinition;
  doneMap?: Record<string, boolean>;
  overdueCount?: number;
};

export function GoalCard({ goal, doneMap, overdueCount = 0 }: Props) {
  const { pct, doneCount, total } = getGoalProgress(goal, doneMap);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{goal.emoji}</span>
            <h3 className="text-base font-semibold">{goal.title}</h3>

            {/* Priority badge */}
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                PRIORITY_COLOR[goal.priority] ?? PRIORITY_COLOR.low,
              ].join(" ")}
            >
              {goal.priority}
            </span>

            {/* Overdue badge */}
            {overdueCount > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                {overdueCount} overdue
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">{goal.subtitle}</p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold tabular-nums">{doneCount}/{total}</div>
          <div className="text-xs text-muted-foreground">steps</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <div className="flex justify-end">
        <Button asChild variant="secondary">
          <Link to={`/goals/${goal.id}`}>View details</Link>
        </Button>
      </div>
    </div>
  );
}