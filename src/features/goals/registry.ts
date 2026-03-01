import { lazy } from "react";
import type { ComponentType } from "react";
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

type ModuleExports = Record<string, unknown>;

const lazyNamed = <T extends ModuleExports, K extends keyof T>(
  loader: () => Promise<T>,
  key: K,
) => lazy(() => loader().then((mod) => ({ default: mod[key] as ComponentType })));

const FinanceGoalPage = lazyNamed(() => import("./modules/finance/FinanceGoalPage"), "FinanceGoalPage");
const FitnessGoalPage = lazyNamed(() => import("./modules/fitness/FitnessGoalPage"), "FitnessGoalPage");
const FreelanceGoalPage = lazyNamed(() => import("./modules/freelance/FreelanceGoalPage"), "FreelanceGoalPage");
const FrontendRoadmapGoalPage = lazyNamed(() => import("./modules/frontend-roadmap/FrontendRoadmapGoalPage"), "FrontendRoadmapGoalPage");
const MarathonGoalPage = lazyNamed(() => import("./modules/marathon/MarathonGoalPage"), "MarathonGoalPage");
const ReadingGoalPage = lazyNamed(() => import("./modules/reading/ReadingGoalPage"), "ReadingGoalPage");
const SkincareGoalPage = lazyNamed(() => import("./modules/skincare/SkincareGoalPage"), "SkincareGoalPage");
const TravelPlanningGoalPage = lazyNamed(() => import("./modules/travel-planning/TravelPlanningGoalPage"), "TravelPlanningGoalPage");
const UniversityGoalPage = lazyNamed(() => import("./modules/university/UniversityGoalPage"), "UniversityGoalPage");
const YouTubeChannelGoalPage = lazyNamed(() => import("./modules/youtube-channel/YoutubeChannelGoalPage"), "YouTubeChannelGoalPage");




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
