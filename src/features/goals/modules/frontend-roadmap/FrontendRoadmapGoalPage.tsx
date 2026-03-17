import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { StudyStreakCard } from "./components/StudyStreakCard";
import { DrillTrackerCard } from "./components/DrillTrackerCard";
import { FocusCard } from "./components/FocusCard";

const GOAL_ID = "frontend-roadmap";

export function FrontendRoadmapGoalPage() {
  return (
    <PageScaffold width="wide">
      <PageHeader
        title="💻 Frontend Roadmap"
        description="Track study streaks, drills, and current focus."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <StudyStreakCard goalId={GOAL_ID} />
        <DrillTrackerCard goalId={GOAL_ID} />
        <FocusCard goalId={GOAL_ID} />
      </div>
    </PageScaffold>
  );
}
