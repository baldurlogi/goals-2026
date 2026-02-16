import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { goalsRegistry } from "./registry";
import { GenericGoalPage } from "./GenericGoalPage";

// Custom goal pages
import { FinanceGoalPage } from "./goals/finance/FinanceGoalPage";
import { FitnessGoalPage } from "./goals/fitness/FitnessGoalPage";
import { FreelanceGoalPage } from "./goals/freelance/FreelanceGoalPage";
import { FrontendRoadmapGoalPage } from "./goals/frontend-roadmap/FrontendRoadmapGoalPage";
import { MarathonGoalPage } from "./goals/marathon/MarathonGoalPage";
// import { ReadinGoalPage } from "./goals/reading/ReadingGoalPage";
// import { SkincareGoalPage } from "./goals/skincare/SkincareGoalPage";
// import { TravelPlanningGoalPage } from "./goals/travel-planning/TravelPlanningGoalPage";
// import { UniversityGoalPage } from "./goals/university/UniversityGoalPage";
// import { YoutubeChannelGoalPage } from "./goals/youtube-channel/YoutubeChannelGoalPage";




// Import goal defs for stable IDs (prevents string drift)
import { financeGoal } from "./goals/finance/financeGoal";
import { fitnessGoal } from "./goals/fitness/fitnessGoal";
import { freelanceGoal } from "./goals/freelance/freelanceGoal";
import { frontendRoadmapGoal } from "./goals/frontend-roadmap/frontendRoadmapGoal";
import { marathonGoal } from "./goals/marathon/marathonGoal";
// import { readingGoal } from "./goals/reading/readingGoal";
// import { skincareeGoal } from "./goals/skincare/freelanceGoal";
// import { travelPlanningGoal } from "./goals/travel-planning/frontendRoadmapGoal";
// import { universityGoal } from "./goals/university/universityGoal";
// import { youtubeChannelGoal } from "./goals/youtube-channel/youtubeChannelGoal";



export function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();

  // If you want safety
  if (!goalId) return null;

  // ✅ Custom dashboards
  if (goalId === financeGoal.id) return <FinanceGoalPage />;
  if (goalId === fitnessGoal.id) return <FitnessGoalPage />;
  if (goalId === freelanceGoal.id) return <FreelanceGoalPage />;
  if (goalId === frontendRoadmapGoal.id) return <FrontendRoadmapGoalPage />;
  if (goalId === marathonGoal.id) return <MarathonGoalPage />;
  // if (goalId === readingGoal.id) return <ReadingGoalPage />;
  // if (goalId === skincareGoal.id) return <SkincareGoalPage />;
  // if (goalId === travelPlanningGoal.id) return <TravelPlanningGoalPage />;
  // if (goalId === universityGoal.id) return <UniversityGoalPage />;
  // if (goalId === youtubeChannelGoal.id) return <YoutubeChannelGoalPage />;

  // ✅ Fallback: generic page for everything else
  const goal = useMemo(
    () => goalsRegistry.find((g) => g.id === goalId),
    [goalId]
  );

  return <GenericGoalPage goalId={goalId} goal={goal} />;
}
