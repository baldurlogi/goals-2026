import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { ApplicationsCard } from "./components/ApplicationsCard";
import { DeadlinesCard } from "./components/DeadlinesCard";
import { ChecklistCard } from "./components/ChecklistCard";

const GOAL_ID = "university";

export function UniversityGoalPage() {
  return (
    <PageScaffold width="wide">
      <PageHeader
        title="🎓 University"
        description="Track applications, deadlines, and checklist."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <ApplicationsCard goalId={GOAL_ID} />
        <DeadlinesCard goalId={GOAL_ID} />
        <ChecklistCard goalId={GOAL_ID} />
      </div>
    </PageScaffold>
  );
}
