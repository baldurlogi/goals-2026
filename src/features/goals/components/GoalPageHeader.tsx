import { Link } from "react-router-dom";
import type { GoalDefinition } from "@/features/goals/goalTypes";
import { getGoalProgress } from "@/features/goals/goalUtils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function GoalPageHeader(props: {
  goal: GoalDefinition;
  doneMap: Record<string, boolean>;
  backHref?: string;
  onReset?: () => void;
}) {
  const { goal, doneMap, backHref = "/goals", onReset } = props;
  const { pct, doneCount, total } = getGoalProgress(goal, doneMap);

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">
          <Link to={backHref} className="underline">
            Goals
          </Link>{" "}
          / <span>{goal.title}</span>
        </div>

        <h1 className="text-2xl font-semibold">
          {goal.emoji} {goal.title}
        </h1>

        <p className="text-muted-foreground">{goal.subtitle}</p>

        <div className="text-sm text-muted-foreground">
          {doneCount}/{total} steps • Priority:{" "}
          <span className="capitalize text-foreground font-medium">
            {goal.priority}
          </span>
        </div>

        <div className="mt-3 max-w-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {doneCount}/{total} steps
            </span>
            <span>{pct}%</span>
          </div>

          <Progress value={pct} className="mt-2 h-2" />
        </div>
      </div>

      {onReset ? (
        <div className="flex flex-col items-end gap-2">
          <Button variant="ghost" onClick={onReset}>
            Reset steps
          </Button>
        </div>
      ) : null}
    </div>
  );
}
