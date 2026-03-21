import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { RoutineStreakCard } from "@/features/goals/modules/skincare/components/RoutineStreakCard";
import { RoutineChecklistCard } from "@/features/goals/modules/skincare/components/RoutineChecklistCard";
import { SkinLogCard } from "@/features/goals/modules/skincare/components/SkinLogCard";

const SKINCARE_PAGE_ID = "skincare";

export default function SkincarePage() {
  return (
    <PageScaffold width="wide">
      <PageHeader
        title="Skincare"
        description="Keep your routine, streak, and skin notes in one dedicated place."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <RoutineStreakCard goalId={SKINCARE_PAGE_ID} />
        <RoutineChecklistCard goalId={SKINCARE_PAGE_ID} />
        <SkinLogCard goalId={SKINCARE_PAGE_ID} />
      </div>
    </PageScaffold>
  );
}
