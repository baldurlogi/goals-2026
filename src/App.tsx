import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoalsStoreProvider } from "@/features/goals/goalStore";
import { AppLayout } from "@/app/AppLayout";

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

            <Route path="/daily-plan/nutrition" element={<NutritionTab />} />
            <Route path="/daily-plan/schedule" element={<ScheduleTab />} />
            <Route path="/daily-plan/reading" element={<ReadingTab />} />

            <Route path="/upcoming" element={<UpcomingTasksPage />} />
            <Route path="/goals" element={<GoalsTab />} />
            <Route path="/goals/:goalId" element={<GoalDetailPage />} />

            <Route path="/daily-plan" element={<Navigate to="/" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GoalsStoreProvider>
    </BrowserRouter>
  );
}
