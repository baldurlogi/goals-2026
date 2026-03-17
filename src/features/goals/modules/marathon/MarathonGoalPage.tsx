import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { RunStreakCard } from "./components/RunStreakCard";
import { WeeklyMileageCard } from "./components/WeeklyMileageCard";
import { LongRunPlannerCard } from "./components/LongRunPlannerCard";

const GOAL_ID = "half-marathon";

export function MarathonGoalPage() {
  return (
    <PageScaffold width="wide">
      <PageHeader
        title="🏃 Marathon"
        description="Track run streaks, weekly mileage, and long runs."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <RunStreakCard goalId={GOAL_ID} />
        <WeeklyMileageCard goalId={GOAL_ID} />
        <LongRunPlannerCard goalId={GOAL_ID} />
      </div>
    </PageScaffold>
  );
}
