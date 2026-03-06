import { RevenueCard } from "./components/RevenueCard";
import { PipelineCard } from "./components/PipelineCard";
import { SaaSStageCard } from "./components/SaaSStageCard";

const GOAL_ID = "freelance";

export function FreelanceGoalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">💼 Freelance</h1>
        <p className="text-muted-foreground text-sm mt-1">Track revenue, pipeline, and SaaS progress.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <RevenueCard goalId={GOAL_ID} />
        <PipelineCard goalId={GOAL_ID} />
        <SaaSStageCard goalId={GOAL_ID} />
      </div>
    </div>
  );
}