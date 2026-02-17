import { useGoalsStore } from "../../goalStore";
import { youtubeChannelGoal } from "./youtubeChannelGoal";

import { GoalPageHeader } from "@/features/goals/components/GoalPageHeader";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { TimelineCard } from "@/features/goals/components/TimelineCard";

import { UploadScheduleCard } from "./components/UploadScheduleCard";
import { ContentPipelineCard } from "./components/ContentPipelineCard";
import { MetricsCard } from "./components/MetricsCard";

export function YouTubeChannelGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = youtubeChannelGoal.id;
  const doneMap = state.done[goalId] ?? {};

  return (
    <div className="space-y-6">
      <GoalPageHeader
        goal={youtubeChannelGoal}
        doneMap={doneMap}
        onReset={() => dispatch({ type: "resetGoal", goalId })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={youtubeChannelGoal.title}
            steps={youtubeChannelGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) => dispatch({ type: "toggleStep", goalId, stepId })}
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={youtubeChannelGoal.steps} doneMap={doneMap} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <UploadScheduleCard goalId={goalId} />
          <ContentPipelineCard goalId={goalId} />
          <MetricsCard goalId={goalId} />
        </div>
      </div>
    </div>
  );
}
