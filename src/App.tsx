import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoalsStoreProvider } from "@/features/goals/goalStore";
import { AuthProvider } from "@/auth/AuthProvider";
import { RequireAuth } from "@/auth/RequireAuth";
import { AppLayout } from "@/app/AppLayout";

import { NutritionTab }     from "@/features/nutrition/NutritionTab";
import { ScheduleTab }      from "@/features/schedule/ScheduleTab";
import { ReadingTab }       from "@/features/reading/ReadingTab";
import { GoalsTab }         from "@/features/goals/GoalsTab";
import { UpcomingTasksPage }from "@/features/goals/UpcomingTasksPage";
import { GoalDetailPage }   from "@/features/goals/GoalsDetailPage";
import { TodosPage }        from "@/features/todos/TodosPage";
import { FitnessGoalPage } from "./features/goals/modules/fitness/FitnessGoalPage";
import DashboardPage        from "@/app/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GoalsStoreProvider>
          <RequireAuth>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />

                <Route path="/nutrition" element={<NutritionTab />} />
                <Route path="/schedule"  element={<ScheduleTab />} />
                <Route path="/reading"   element={<ReadingTab />} />

                <Route path="/goals"         element={<GoalsTab />} />
                <Route path="/goals/:goalId" element={<GoalDetailPage />} />
                <Route path="/upcoming"      element={<UpcomingTasksPage />} />
                <Route path="/todos"         element={<TodosPage />} />
                <Route path="/fitness"       element={<FitnessGoalPage />} />

                <Route path="/daily-plan" element={<Navigate to="/" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RequireAuth>
        </GoalsStoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}