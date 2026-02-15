import type { GoalDefinition } from "./goalTypes";

import { financeGoal } from "./goals/finance/financeGoal";
import { fitnessGoal } from "./goals/fitness/fitnessGoal";
import { freelanceGoal } from "./goals/freelance/freelanceGoal";
import { frontendRoadmapGoal } from "./goals/frontend-roadmap/frontendRoadmapGoal";
import { marathonGoal } from "./goals/marathon/marathonGoal";
import { readingGoal } from "./goals/reading/readingGoal";
import { skincareGoal } from "./goals/skincare/skincareGoal";
import { travelPlanningGoal } from "./goals/travel-planning/travelPlanningGoal";
import { universityGoal } from "./goals/university/universityGoal";
import { youtubeChannelGoal } from "./goals/youtube-channel/youtubeChannelGoal";

export const goalsRegistry: GoalDefinition[] = [
  financeGoal,
  fitnessGoal,
  freelanceGoal,
  frontendRoadmapGoal,
  marathonGoal,
  readingGoal,
  skincareGoal,
  travelPlanningGoal,
  universityGoal,
  youtubeChannelGoal,
];
