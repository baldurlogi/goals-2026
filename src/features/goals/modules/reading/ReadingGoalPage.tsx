import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { ReadingStreakCard } from "./components/ReadingStreakCard";
import { BookProgressCard } from "./components/BookProgressCard";
import { ReadingMinutesCard } from "./components/ReadingMinutesCard";

const GOAL_ID = "reading";

export function ReadingGoalPage() {
  return (
    <PageScaffold width="wide">
      <PageHeader
        title="📚 Reading"
        description="Track reading streaks, minutes, and book progress."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <ReadingStreakCard goalId={GOAL_ID} />
        <ReadingMinutesCard goalId={GOAL_ID} />
        <BookProgressCard goalId={GOAL_ID} />
      </div>
    </PageScaffold>
  );
}
