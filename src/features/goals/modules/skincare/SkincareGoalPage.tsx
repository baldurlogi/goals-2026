import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { RoutineStreakCard } from "./components/RoutineStreakCard";
import { RoutineChecklistCard } from "./components/RoutineChecklistCard";
import { SkinLogCard } from "./components/SkinLogCard";

const GOAL_ID = "skincare";

export function SkincareGoalPage() {
  return (
    <PageScaffold width="wide">
      <PageHeader
        title="🌿 Skincare"
        description="Track routine streaks, daily checklist, and skin log."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <RoutineStreakCard goalId={GOAL_ID} />
        <RoutineChecklistCard goalId={GOAL_ID} />
        <SkinLogCard goalId={GOAL_ID} />
      </div>
    </PageScaffold>
  );
}
