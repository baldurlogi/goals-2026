import { Suspense, useMemo } from "react";
import { useParams } from "react-router-dom";

import { goalModuleById, goalsRegistry } from "./registry";
import { GenericGoalPage } from "./GenericGoalPage";

export function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();
  if (!goalId) return null;

  const mod = goalModuleById[goalId];
  if (mod) {
    const Page = mod.Page;
    return (
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
        <Page goalId={goalId} />
      </Suspense>
    );
  }

  const goal = useMemo(() => goalsRegistry.find((g) => g.id === goalId), [goalId]);
  return <GenericGoalPage goalId={goalId} goal={goal} />;
}
