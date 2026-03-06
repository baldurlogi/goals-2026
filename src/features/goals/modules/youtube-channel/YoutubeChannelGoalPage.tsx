import { UploadScheduleCard } from "./components/UploadScheduleCard";
import { ContentPipelineCard } from "./components/ContentPipelineCard";
import { MetricsCard } from "./components/MetricsCard";

const GOAL_ID = "youtube-channel";

export function YouTubeChannelGoalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">🎬 YouTube Channel</h1>
        <p className="text-muted-foreground text-sm mt-1">Track upload schedule, content pipeline, and metrics.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <UploadScheduleCard goalId={GOAL_ID} />
        <ContentPipelineCard goalId={GOAL_ID} />
        <MetricsCard goalId={GOAL_ID} />
      </div>
    </div>
  );
}