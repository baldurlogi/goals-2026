import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { GoalStoreProvider } from "@/features/goals/goalStore";
import { AuthProvider } from "./providers/AuthProvider";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RedirectIfAuth } from "@/features/auth/RedirectIfAuth";
import { RequireOnboarding } from "@/features/onboarding/RequireOnboarding";
import { AppLayout } from "@/app/AppLayout";

import { NutritionPage } from "@/features/nutrition/NutritionPage";
import { SchedulePage } from "@/features/schedule/SchedulePage";
import { ReadingPage } from "@/features/reading/ReadingPage";
import { GoalsPage } from "@/features/goals/GoalsPage";
import { UpcomingTasksPage } from "@/features/goals/UpcomingTasksPage";
import { UserGoalPage } from "@/features/goals/UserGoalPage";
import { TodosPage } from "@/features/todos/TodosPage";
import { FitnessGoalPage } from "@/features/goals/modules/fitness/FitnessGoalPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { AchievementsPage } from "@/features/achievements/AchievementPage";
import { UpgradePage } from "@/features/subscription/UpgradePage";
import { WeeklyReportPage } from "@/features/dashboard/WeeklyReportPage";
import { LandingPage } from "@/features/landing/LandingPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { AuthCallbackPage } from "@/features/auth/AuthCallbackPage";
import { PrivacyPage } from "@/features/legal/PrivacyPage";
import { TermsPage } from "@/features/legal/TermsPage";



export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <AuthProvider>
        <Routes>
          {/* ── PUBLIC ────────────────────────────────────────── */}
          <Route path="/" element={<RedirectIfAuth><LandingPage /></RedirectIfAuth>} />
          <Route path="/auth" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

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

            <Route path="nutrition" element={<NutritionPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="reading" element={<ReadingPage />} />

            <Route path="goals" element={<GoalsPage />} />
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
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="upgrade" element={<UpgradePage />} />
            <Route path="weekly-report" element={<WeeklyReportPage />} />

            <Route path="daily-plan" element={<Navigate to="/app" replace />} />
          </Route>

          {/* ── FALLBACK ──────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}