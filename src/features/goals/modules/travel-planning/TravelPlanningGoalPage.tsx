import { useGoalsStore } from "../../goalStore";
import { travelPlanningGoal } from "./travelPlanningGoal";

import { GoalPageHeader } from "@/features/goals/components/GoalPageHeader";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { TimelineCard } from "@/features/goals/components/TimelineCard";

import { TripCountdownCard } from "./components/TripCountdownCard";
import { BudgetCard } from "./components/BudgetCard";
import { ItineraryNotesCard } from "./components/ItineraryNotesCard";

export function TravelPlanningGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = travelPlanningGoal.id;
  const doneMap = state.done[goalId] ?? {};

  return (
    <div className="space-y-6">
      <GoalPageHeader
        goal={travelPlanningGoal}
        doneMap={doneMap}
        onReset={() => dispatch({ type: "resetGoal", goalId })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={travelPlanningGoal.title}
            steps={travelPlanningGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) => dispatch({ type: "toggleStep", goalId, stepId })}
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={travelPlanningGoal.steps} doneMap={doneMap} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <TripCountdownCard goalId={goalId} />
          <BudgetCard goalId={goalId} currency="DKK" />
          <ItineraryNotesCard goalId={goalId} />
        </div>
      </div>
    </div>
  );
}
