import { WorkoutStreakCard } from "./components/WorkoutStreakCard";
import { WeeklySplitCard } from "./components/WeeklySplitCard";
import { MacroTargetsCard } from "./components/MacroTargetsCard";

const GOAL_ID = "fitness";

export function FitnessGoalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">🏋️ Fitness</h1>
        <p className="text-muted-foreground text-sm mt-1">Track workouts, streaks, and macro targets.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <WorkoutStreakCard goalId={GOAL_ID} />
        <WeeklySplitCard goalId={GOAL_ID} />
        <MacroTargetsCard />
      </div>
    </div>
  );
}