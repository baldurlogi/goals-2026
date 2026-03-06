import { ReadingStreakCard } from "./components/ReadingStreakCard";
import { BookProgressCard } from "./components/BookProgressCard";
import { ReadingMinutesCard } from "./components/ReadingMinutesCard";

const GOAL_ID = "reading";

export function ReadingGoalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">📚 Reading</h1>
        <p className="text-muted-foreground text-sm mt-1">Track reading streaks, minutes, and book progress.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ReadingStreakCard goalId={GOAL_ID} />
        <ReadingMinutesCard goalId={GOAL_ID} />
        <BookProgressCard goalId={GOAL_ID} />
      </div>
    </div>
  );
}