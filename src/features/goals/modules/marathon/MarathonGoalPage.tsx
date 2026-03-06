import { RunStreakCard } from "./components/RunStreakCard";
import { WeeklyMileageCard } from "./components/WeeklyMileageCard";
import { LongRunPlannerCard } from "./components/LongRunPlannerCard";

const GOAL_ID = "half-marathon";

export function MarathonGoalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">🏃 Marathon</h1>
        <p className="text-muted-foreground text-sm mt-1">Track run streaks, weekly mileage, and long runs.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <RunStreakCard goalId={GOAL_ID} />
        <WeeklyMileageCard goalId={GOAL_ID} />
        <LongRunPlannerCard goalId={GOAL_ID} />
      </div>
    </div>
  );
}