import { ApplicationsCard } from "./components/ApplicationsCard";
import { DeadlinesCard } from "./components/DeadlinesCard";
import { ChecklistCard } from "./components/ChecklistCard";

const GOAL_ID = "university";

export function UniversityGoalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">🎓 University</h1>
        <p className="text-muted-foreground text-sm mt-1">Track applications, deadlines, and checklist.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ApplicationsCard goalId={GOAL_ID} />
        <DeadlinesCard goalId={GOAL_ID} />
        <ChecklistCard goalId={GOAL_ID} />
      </div>
    </div>
  );
}