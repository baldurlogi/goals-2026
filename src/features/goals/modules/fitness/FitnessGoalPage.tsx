import { useGoalsStore } from "../../goalStore";
import { fitnessGoal } from "./fitnessGoal";

import { GoalPageHeader } from "@/features/goals/components/GoalPageHeader";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { TimelineCard } from "@/features/goals/components/TimelineCard";

import { WorkoutStreakCard } from "./components/WorkoutStreakCard";
import { WeeklySplitCard } from "./components/WeeklySplitCard";
import { MacroTargetsCard } from "./components/MacroTargetsCard";

export function FitnessGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = fitnessGoal.id;
  const doneMap = state.done[goalId] ?? {};

  return (
    <div className="space-y-6">
      <GoalPageHeader
        goal={fitnessGoal}
        doneMap={doneMap}
        onReset={() => dispatch({ type: "resetGoal", goalId })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: steps + timeline */}
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={fitnessGoal.title}
            steps={fitnessGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) => dispatch({ type: "toggleStep", goalId, stepId })}
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={fitnessGoal.steps} doneMap={doneMap} />
        </div>

        {/* Right: goal-specific widgets */}
        <div className="lg:col-span-1 space-y-6">
          <WorkoutStreakCard goalId={goalId} />
          <WeeklySplitCard goalId={goalId} />
          <MacroTargetsCard />
        </div>
      </div>
    </div>
  );
}
