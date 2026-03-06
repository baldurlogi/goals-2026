import { RoutineStreakCard } from "./components/RoutineStreakCard";
import { RoutineChecklistCard } from "./components/RoutineChecklistCard";
import { SkinLogCard } from "./components/SkinLogCard";

const GOAL_ID = "skincare";

export function SkincareGoalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">🌿 Skincare</h1>
        <p className="text-muted-foreground text-sm mt-1">Track routine streaks, daily checklist, and skin log.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <RoutineStreakCard goalId={GOAL_ID} />
        <RoutineChecklistCard goalId={GOAL_ID} />
        <SkinLogCard goalId={GOAL_ID} />
      </div>
    </div>
  );
}