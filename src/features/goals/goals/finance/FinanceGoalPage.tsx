import { Link } from "react-router-dom";
import { useGoalsStore } from "../../goalStore";
import { getGoalProgress } from "../../goalUtils";
import { financeGoal } from "./financeGoal";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { StepsCard } from "./components/StepsCard";
import { TimelineCard } from "./components/TimelineCard";
import { SavingsCard } from "./components/SavingsCard";
import { ExpenseTrackerCard } from "./components/ExpenseTrackerCard";
import { SpendingDonutCard } from "./components/SpendingDonutCard";

export function FinanceGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = financeGoal.id;
  const doneMap = state.done[goalId] ?? {};
  const { pct, doneCount, total } = getGoalProgress(financeGoal, doneMap);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            <Link to="/daily-plan/goals" className="underline">
              Goals
            </Link>{" "}
            / <span>{financeGoal.title}</span>
          </div>

          <h1 className="text-2xl font-semibold">
            {financeGoal.emoji} {financeGoal.title}
          </h1>

          <p className="text-muted-foreground">{financeGoal.subtitle}</p>

          <div className="text-sm text-muted-foreground">
            {doneCount}/{total} steps • Priority:{" "}
            <span className="capitalize text-foreground font-medium">
              {financeGoal.priority}
            </span>
          </div>

          {/* Header progress bar */}
          <div className="mt-3 max-w-xl">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {doneCount}/{total} steps
              </span>
              <span>{pct}%</span>
            </div>
            <Progress
              value={pct}
              className="mt-2 h-2"
              indicatorClassName="bg-emerald-400"
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button
            variant="ghost"
            onClick={() => dispatch({ type: "resetGoal", goalId })}
          >
            Reset steps
          </Button>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: main (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={financeGoal.title}
            steps={financeGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) =>
              dispatch({ type: "toggleStep", goalId, stepId })
            }
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={financeGoal.steps} doneMap={doneMap} />
        </div>

        {/* RIGHT: sidebar (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          <SavingsCard goalId={goalId} target={75000} currency="DKK" />
          <ExpenseTrackerCard goalId={goalId} />
        </div>

        {/* FULL WIDTH chart */}
        <div className="lg:col-span-3">
          <SpendingDonutCard goalId={goalId} />
        </div>
      </div>
    </div>
  );
}
