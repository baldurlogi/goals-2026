import { useGoalsStore } from "../../goalStore";
import { marathonGoal } from "./marathonGoal";

import { GoalPageHeader } from "@/features/goals/components/GoalPageHeader";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { TimelineCard } from "@/features/goals/components/TimelineCard";

import { RunStreakCard } from "./components/RunStreakCard";
import { WeeklyMileageCard } from "./components/WeeklyMileageCard";
import { LongRunPlannerCard } from "./components/LongRunPlannerCard";

export function MarathonGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = marathonGoal.id; // "half-marathon"
  const doneMap = state.done[goalId] ?? {};

  return (
    <div className="space-y-6">
      <GoalPageHeader
        goal={marathonGoal}
        doneMap={doneMap}
        onReset={() => dispatch({ type: "resetGoal", goalId })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={marathonGoal.title}
            steps={marathonGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) => dispatch({ type: "toggleStep", goalId, stepId })}
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={marathonGoal.steps} doneMap={doneMap} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <RunStreakCard goalId={goalId} />
          <WeeklyMileageCard goalId={goalId} />
          <LongRunPlannerCard goalId={goalId} />
        </div>
      </div>
    </div>
  );
}
