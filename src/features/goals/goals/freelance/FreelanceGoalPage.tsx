import { useGoalsStore } from "../../goalStore";
import { freelanceGoal } from "./freelanceGoal";

import { GoalPageHeader } from "@/features/goals/components/GoalPageHeader";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { TimelineCard } from "@/features/goals/components/TimelineCard";

import { RevenueCard } from "./componetns/RevenueCard";
import { PipelineCard } from "./componetns/PipelineCard";
import { SaaSStageCard } from "./componetns/SaaSStageCard";

export function FreelanceGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = freelanceGoal.id;
  const doneMap = state.done[goalId] ?? {};

  return (
    <div className="space-y-6">
      <GoalPageHeader
        goal={freelanceGoal}
        doneMap={doneMap}
        onReset={() => dispatch({ type: "resetGoal", goalId })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: steps + timeline */}
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={freelanceGoal.title}
            steps={freelanceGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) => dispatch({ type: "toggleStep", goalId, stepId })}
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={freelanceGoal.steps} doneMap={doneMap} />
        </div>

        {/* Right: goal-specific widgets */}
        <div className="lg:col-span-1 space-y-6">
          <RevenueCard goalId={goalId} />
          <PipelineCard goalId={goalId} />
          <SaaSStageCard goalId={goalId} />
        </div>
      </div>
    </div>
  );
}
