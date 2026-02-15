import { Link } from "react-router-dom";
import type { GoalDefinition } from "../goalTypes";
import { getGoalProgress } from "../goalUtils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type Props = {
  goal: GoalDefinition;
  doneMap?: Record<string, boolean>;
};

export function GoalCard({ goal, doneMap }: Props) {
  const { pct, doneCount, total } = getGoalProgress(goal, doneMap);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{goal.emoji}</span>
            <h3 className="text-base font-semibold">{goal.title}</h3>
          </div>

          <p className="text-sm text-muted-foreground">{goal.subtitle}</p>
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            Priority: {goal.priority}
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold">{doneCount}/{total}</div>
          <div className="text-xs text-muted-foreground">steps</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <div className="flex justify-end pt-1">
        <Button asChild variant="secondary">
          <Link to={`/goals/${goal.id}`}>View details</Link>
        </Button>
      </div>
    </div>
  );
}
