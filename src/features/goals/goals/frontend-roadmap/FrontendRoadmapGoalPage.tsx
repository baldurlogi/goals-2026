import { useGoalsStore } from "../../goalStore";
import { frontendRoadmapGoal } from "./frontendRoadmapGoal";

import { GoalPageHeader } from "@/features/goals/components/GoalPageHeader";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { TimelineCard } from "@/features/goals/components/TimelineCard";

import { StudyStreakCard } from "./components/StudyStreakCard";
import { DrillTrackerCard } from "./components/DrillTrackerCard";
import { FocusCard } from "./components/FocusCard";

export function FrontendRoadmapGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = frontendRoadmapGoal.id;
  const doneMap = state.done[goalId] ?? {};

  return (
    <div className="space-y-6">
      <GoalPageHeader
        goal={frontendRoadmapGoal}
        doneMap={doneMap}
        onReset={() => dispatch({ type: "resetGoal", goalId })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={frontendRoadmapGoal.title}
            steps={frontendRoadmapGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) =>
              dispatch({ type: "toggleStep", goalId, stepId })
            }
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={frontendRoadmapGoal.steps} doneMap={doneMap} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <StudyStreakCard goalId={goalId} />
          <DrillTrackerCard goalId={goalId} />
          <FocusCard goalId={goalId} />
        </div>
      </div>
    </div>
  );
}
