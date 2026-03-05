import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { GoalStoreProvider } from "@/features/goals/goalStore";
import { AuthProvider } from "@/auth/AuthProvider";
import { RequireAuth } from "@/auth/RequireAuth";
import { RequireOnboarding } from "@/features/onboarding/RequireOnboarding";
import { AppLayout } from "@/app/AppLayout";

import { NutritionTab } from "@/features/nutrition/NutritionTab";
import { ScheduleTab } from "@/features/schedule/ScheduleTab";
import { ReadingTab } from "@/features/reading/ReadingTab";
import { GoalsTab } from "@/features/goals/GoalsTab";
import { UpcomingTasksPage } from "@/features/goals/UpcomingTasksPage";
import { UserGoalPage } from "@/features/goals/UserGoalPage";
import { TodosPage } from "@/features/todos/TodosPage";
import { FitnessGoalPage } from "@/features/goals/modules/fitness/FitnessGoalPage";
import DashboardPage from "@/app/DashboardPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { LandingPage } from "@/features/landing/LandingPage";
import { LoginPage } from "@/auth/LoginPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── PUBLIC ────────────────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<LoginPage />} />

          {/* ── PROTECTED APP ─────────────────────────────────── */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <GoalStoreProvider>
                    <AppLayout />
                  </GoalStoreProvider>
                </RequireOnboarding>
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />

            <Route path="nutrition" element={<NutritionTab />} />
            <Route path="schedule" element={<ScheduleTab />} />
            <Route path="reading" element={<ReadingTab />} />

            <Route path="goals" element={<GoalsTab />} />

            {/* Dynamic goal page — works for all user-created goals */}
            <Route
              path="goals/:goalId"
              element={
                <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
                  <UserGoalPage />
                </Suspense>
              }
            />

            <Route path="upcoming" element={<UpcomingTasksPage />} />
            <Route path="todos" element={<TodosPage />} />
            <Route path="fitness" element={<FitnessGoalPage />} />
            <Route path="profile" element={<ProfilePage />} />

            <Route path="daily-plan" element={<Navigate to="/app" replace />} />
          </Route>

          {/* ── FALLBACK ──────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}