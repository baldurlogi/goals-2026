import { lazy } from "react";
import type { GoalModule } from "./goalTypes";

import { financeGoal } from "./modules/finance/financeGoal";
import { fitnessGoal } from "./modules/fitness/fitnessGoal";
import { freelanceGoal } from "./modules/freelance/freelanceGoal";
import { frontendRoadmapGoal } from "./modules/frontend-roadmap/frontendRoadmapGoal";
import { marathonGoal } from "./modules/marathon/marathonGoal";
import { readingGoal } from "./modules/reading/readingGoal";
import { skincareGoal } from "./modules/skincare/skincareGoal";
import { travelPlanningGoal } from "./modules/travel-planning/travelPlanningGoal";
import { universityGoal } from "./modules/university/universityGoal";
import { youtubeChannelGoal } from "./modules/youtube-channel/youtubeChannelGoal";

// Lazy-load pages (your pages are named exports, so we map to default)
const FinanceGoalPage = lazy(() =>
  import("./modules/finance/FinanceGoalPage").then((m) => ({ default: m.FinanceGoalPage }))
);
const FitnessGoalPage = lazy(() =>
  import("./modules/fitness/FitnessGoalPage").then((m) => ({ default: m.FitnessGoalPage }))
);
const FreelanceGoalPage = lazy(() =>
  import("./modules/freelance/FreelanceGoalPage").then((m) => ({ default: m.FreelanceGoalPage }))
);
const FrontendRoadmapGoalPage = lazy(() =>
  import("./modules/frontend-roadmap/FrontendRoadmapGoalPage").then((m) => ({
    default: m.FrontendRoadmapGoalPage,
  }))
);
const MarathonGoalPage = lazy(() =>
  import("./modules/marathon/MarathonGoalPage").then((m) => ({ default: m.MarathonGoalPage }))
);
const ReadingGoalPage = lazy(() =>
  import("./modules/reading/ReadingGoalPage").then((m) => ({ default: m.ReadingGoalPage }))
);
const SkincareGoalPage = lazy(() =>
  import("./modules/skincare/SkincareGoalPage").then((m) => ({ default: m.SkincareGoalPage }))
);
const TravelPlanningGoalPage = lazy(() =>
  import("./modules/travel-planning/TravelPlanningGoalPage").then((m) => ({
    default: m.TravelPlanningGoalPage,
  }))
);
const UniversityGoalPage = lazy(() =>
  import("./modules/university/UniversityGoalPage").then((m) => ({ default: m.UniversityGoalPage }))
);
const YouTubeChannelGoalPage = lazy(() =>
  import("./modules/youtube-channel/YoutubeChannelGoalPage").then((m) => ({
    default: m.YouTubeChannelGoalPage,
  }))
);

export const goalModules = [
  { goal: financeGoal, Page: FinanceGoalPage },
  { goal: fitnessGoal, Page: FitnessGoalPage },
  { goal: freelanceGoal, Page: FreelanceGoalPage },
  { goal: frontendRoadmapGoal, Page: FrontendRoadmapGoalPage },
  { goal: marathonGoal, Page: MarathonGoalPage },
  { goal: readingGoal, Page: ReadingGoalPage },
  { goal: skincareGoal, Page: SkincareGoalPage },
  { goal: travelPlanningGoal, Page: TravelPlanningGoalPage },
  { goal: universityGoal, Page: UniversityGoalPage },
  { goal: youtubeChannelGoal, Page: YouTubeChannelGoalPage },
] satisfies GoalModule[];

export const goalsRegistry = goalModules.map((m) => m.goal);

export const goalModuleById = Object.fromEntries(
  goalModules.map((m) => [m.goal.id, m])
) as Record<string, GoalModule>;
