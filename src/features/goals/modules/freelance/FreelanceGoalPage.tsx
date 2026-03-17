import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { RevenueCard } from "./components/RevenueCard";
import { PipelineCard } from "./components/PipelineCard";
import { SaaSStageCard } from "./components/SaaSStageCard";

const GOAL_ID = "freelance";

export function FreelanceGoalPage() {
  return (
    <PageScaffold width="wide">
      <PageHeader
        title="💼 Freelance"
        description="Track revenue, pipeline, and SaaS progress."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <RevenueCard goalId={GOAL_ID} />
        <PipelineCard goalId={GOAL_ID} />
        <SaaSStageCard goalId={GOAL_ID} />
      </div>
    </PageScaffold>
  );
}
