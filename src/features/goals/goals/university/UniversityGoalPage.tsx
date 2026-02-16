import { useGoalsStore } from "../../goalStore";
import { universityGoal } from "./universityGoal";

import { GoalPageHeader } from "@/features/goals/components/GoalPageHeader";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { TimelineCard } from "@/features/goals/components/TimelineCard";

import { ApplicationsCard } from "./components/ApplicationsCard";
import { DeadlinesCard } from "./components/DeadlinesCard";
import { ChecklistCard } from "./components/ChecklistCard";

export function UniversityGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = universityGoal.id;
  const doneMap = state.done[goalId] ?? {};

  return (
    <div className="space-y-6">
      <GoalPageHeader
        goal={universityGoal}
        doneMap={doneMap}
        onReset={() => dispatch({ type: "resetGoal", goalId })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={universityGoal.title}
            steps={universityGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) => dispatch({ type: "toggleStep", goalId, stepId })}
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={universityGoal.steps} doneMap={doneMap} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <ApplicationsCard goalId={goalId} />
          <DeadlinesCard goalId={goalId} />
          <ChecklistCard goalId={goalId} />
        </div>
      </div>
    </div>
  );
}
