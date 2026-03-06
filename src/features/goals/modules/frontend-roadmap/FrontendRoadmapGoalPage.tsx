import { StudyStreakCard } from "./components/StudyStreakCard";
import { DrillTrackerCard } from "./components/DrillTrackerCard";
import { FocusCard } from "./components/FocusCard";

const GOAL_ID = "frontend-roadmap";

export function FrontendRoadmapGoalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">💻 Frontend Roadmap</h1>
        <p className="text-muted-foreground text-sm mt-1">Track study streaks, drills, and current focus.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <StudyStreakCard goalId={GOAL_ID} />
        <DrillTrackerCard goalId={GOAL_ID} />
        <FocusCard goalId={GOAL_ID} />
      </div>
    </div>
  );
}