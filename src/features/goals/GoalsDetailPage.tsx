import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { goalsRegistry } from "./registry";
import { GenericGoalPage } from "./GenericGoalPage";

// Custom goal pages
import { FinanceGoalPage } from "./goals/finance/FinanceGoalPage";
import { FitnessGoalPage } from "./goals/fitness/FitnessGoalPage";
import { FreelanceGoalPage } from "./goals/freelance/FreelanceGoalPage";
import { FrontendRoadmapGoalPage } from "./goals/frontend-roadmap/FrontendRoadmapGoalPage";



// Import goal defs for stable IDs (prevents string drift)
import { financeGoal } from "./goals/finance/financeGoal";
import { fitnessGoal } from "./goals/fitness/fitnessGoal";
import { freelanceGoal } from "./goals/freelance/freelanceGoal";
import { frontendRoadmapGoal } from "./goals/frontend-roadmap/frontendRoadmapGoal";



export function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();

  // If you want safety
  if (!goalId) return null;

  // ✅ Custom dashboards
  if (goalId === financeGoal.id) return <FinanceGoalPage />;
  if (goalId === fitnessGoal.id) return <FitnessGoalPage />;
  if (goalId === freelanceGoal.id) return <FreelanceGoalPage />;
  if (goalId === frontendRoadmapGoal.id) return <FrontendRoadmapGoalPage />;


  // ✅ Fallback: generic page for everything else
  const goal = useMemo(
    () => goalsRegistry.find((g) => g.id === goalId),
    [goalId]
  );

  return <GenericGoalPage goalId={goalId} goal={goal} />;
}
