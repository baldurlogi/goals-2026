import { Suspense, useMemo } from "react";
import { useParams } from "react-router-dom";

import { goalModuleById, goalsRegistry } from "./registry";
import { GenericGoalPage } from "./GenericGoalPage";

export function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();

  const mod = useMemo(() => (goalId ? goalModuleById[goalId] : undefined), [goalId]);
  const goal = useMemo(
    () => (goalId ? goalsRegistry.find((g) => g.id === goalId) : undefined),
    [goalId]
  );

  if (!goalId) return null;

  if (mod) {
    const Page = mod.Page;
    return (
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
        <Page goalId={goalId} />
      </Suspense>
    );
  }

  return <GenericGoalPage goalId={goalId} goal={goal} />;
}