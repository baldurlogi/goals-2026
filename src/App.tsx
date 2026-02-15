import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoalsStoreProvider } from "@/features/goals/goalStore";
import { GoalDetailPage } from "@/features/goals/GoalsDetailPage";

import DailyPlanLayout from "@/app/DailyPlan/DailyPlanLayout";
import { NutritionTab } from "@/features/nutrition/NutritionTab";
import { ScheduleTab } from "@/features/schedule/ScheduleTab";
import { ReadingTab } from "@/features/reading/ReadingTab";
import { GoalsTab } from "@/features/goals/GoalsTab";

export default function App() {
  return (
    <BrowserRouter>
      <GoalsStoreProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/daily-plan/nutrition" replace />} />

          {/* Daily plan tabs become real routes */}
          <Route path="/daily-plan" element={<DailyPlanLayout />}>
            <Route index element={<Navigate to="nutrition" replace />} />
            <Route path="nutrition" element={<NutritionTab />} />
            <Route path="schedule" element={<ScheduleTab />} />
            <Route path="reading" element={<ReadingTab />} />
            <Route path="goals" element={<GoalsTab />} />
          </Route>

          {/* Goal details */}
          <Route path="/goals/:goalId" element={<GoalDetailPage />} />

          <Route path="*" element={<Navigate to="/daily-plan/nutrition" replace />} />
        </Routes>
      </GoalsStoreProvider>
    </BrowserRouter>
  );
}
