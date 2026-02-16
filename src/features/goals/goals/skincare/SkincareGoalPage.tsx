import { useGoalsStore } from "../../goalStore";
import { skincareGoal } from "./skincareGoal";

import { GoalPageHeader } from "@/features/goals/components/GoalPageHeader";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { TimelineCard } from "@/features/goals/components/TimelineCard";

import { RoutineStreakCard } from "./components/RoutineStreakCard";
import { RoutineChecklistCard } from "./components/RoutineChecklistCard";
import { SkinLogCard } from "./components/SkinLogCard";

export function SkincareGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = skincareGoal.id;
  const doneMap = state.done[goalId] ?? {};

  return (
    <div className="space-y-6">
      <GoalPageHeader
        goal={skincareGoal}
        doneMap={doneMap}
        onReset={() => dispatch({ type: "resetGoal", goalId })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={skincareGoal.title}
            steps={skincareGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) => dispatch({ type: "toggleStep", goalId, stepId })}
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={skincareGoal.steps} doneMap={doneMap} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <RoutineStreakCard goalId={goalId} />
          <RoutineChecklistCard goalId={goalId} />
          <SkinLogCard goalId={goalId} />
        </div>
      </div>
    </div>
  );
}
