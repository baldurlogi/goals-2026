import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { UploadScheduleCard } from "./components/UploadScheduleCard";
import { ContentPipelineCard } from "./components/ContentPipelineCard";
import { MetricsCard } from "./components/MetricsCard";

const GOAL_ID = "youtube-channel";

export function YouTubeChannelGoalPage() {
  return (
    <PageScaffold width="wide">
      <PageHeader
        title="🎬 YouTube Channel"
        description="Track upload schedule, content pipeline, and metrics."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <UploadScheduleCard goalId={GOAL_ID} />
        <ContentPipelineCard goalId={GOAL_ID} />
        <MetricsCard goalId={GOAL_ID} />
      </div>
    </PageScaffold>
  );
}
