import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoalsStoreProvider } from "@/features/goals/goalStore";
import { AppLayout } from "@/app/AppLayout";

import DailyPlanLayout from "@/app/daily-plan/DailyPlanLayout";
import { NutritionTab } from "@/features/nutrition/NutritionTab";
import { ScheduleTab } from "@/features/schedule/ScheduleTab";
import { ReadingTab } from "@/features/reading/ReadingTab";

import { GoalsTab } from "@/features/goals/GoalsTab";
import { UpcomingTasksPage } from "@/features/goals/UpcomingTasksPage";
import { GoalDetailPage } from "@/features/goals/GoalsDetailPage";

import DashboardPage from "@/app/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <GoalsStoreProvider>
        <Routes>
          <Route element={<AppLayout />}>
            {/* ✅ "/" is the overview */}
            <Route index element={<DashboardPage />} />

            {/* ✅ Daily plan keeps only “daily” stuff */}
            <Route path="/daily-plan" element={<DailyPlanLayout />}>
              <Route index element={<Navigate to="nutrition" replace />} />
              <Route path="nutrition" element={<NutritionTab />} />
              <Route path="schedule" element={<ScheduleTab />} />
              <Route path="reading" element={<ReadingTab />} />
            </Route>

            {/* ✅ Move these OUT of the daily-plan tabs */}
            <Route path="/upcoming" element={<UpcomingTasksPage />} />
            <Route path="/goals" element={<GoalsTab />} />
            <Route path="/goals/:goalId" element={<GoalDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GoalsStoreProvider>
    </BrowserRouter>
  );
}
