import { useGoalsStore } from "../../goalStore";
import { readingGoal } from "./readingGoal";

import { GoalPageHeader } from "@/features/goals/components/GoalPageHeader";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { TimelineCard } from "@/features/goals/components/TimelineCard";

import { ReadingStreakCard } from "./components/ReadingStreakCard";
import { BookProgressCard } from "./components/BookProgressCard";
import { ReadingMinutesCard } from "./components/ReadingMinutesCard";

export function ReadingGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = readingGoal.id;
  const doneMap = state.done[goalId] ?? {};

  return (
    <div className="space-y-6">
      <GoalPageHeader
        goal={readingGoal}
        doneMap={doneMap}
        onReset={() => dispatch({ type: "resetGoal", goalId })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={readingGoal.title}
            steps={readingGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) =>
              dispatch({ type: "toggleStep", goalId, stepId })
            }
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={readingGoal.steps} doneMap={doneMap} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <ReadingStreakCard goalId={goalId} />
          <ReadingMinutesCard goalId={goalId} />
          <BookProgressCard goalId={goalId} />
        </div>
      </div>
    </div>
  );
}
