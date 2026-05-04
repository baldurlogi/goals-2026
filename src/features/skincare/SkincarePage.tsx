import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { RoutineStreakCard } from "@/features/skincare/components/RoutineStreakCard";
import { RoutineChecklistCard } from "@/features/skincare/components/RoutineChecklistCard";
import { SkinLogCard } from "@/features/skincare/components/SkinLogCard";

const SKINCARE_PAGE_ID = "skincare";

export default function SkincarePage() {
  return (
    <PageScaffold width="wide">
      <PageHeader
        title="Skincare"
        description="Keep your routine, streak, and skin notes in one dedicated place."
      />

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7 xl:col-span-8">
          <RoutineChecklistCard goalId={SKINCARE_PAGE_ID} />
        </div>

        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <RoutineStreakCard goalId={SKINCARE_PAGE_ID} />
          <SkinLogCard goalId={SKINCARE_PAGE_ID} />
        </div>
      </div>
    </PageScaffold>
  );
}
