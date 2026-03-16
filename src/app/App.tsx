import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { GoalStoreProvider } from "@/features/goals/goalStore";
import { AuthProvider } from "./providers/AuthProvider";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RedirectIfAuth } from "@/features/auth/RedirectIfAuth";
import { RequireOnboarding } from "@/features/onboarding/RequireOnboarding";
import { AppLayout } from "@/app/AppLayout";

import { LandingPage } from "@/features/landing/LandingPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { AuthCallbackPage } from "@/features/auth/AuthCallbackPage";
import { PrivacyPage } from "@/features/legal/PrivacyPage";
import { TermsPage } from "@/features/legal/TermsPage";

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const NutritionPage = lazy(() => import("@/features/nutrition/NutritionPage").then((module) => ({ default: module.NutritionPage })));
const SchedulePage = lazy(() => import("@/features/schedule/SchedulePage").then((module) => ({ default: module.SchedulePage })));
const ReadingPage = lazy(() => import("@/features/reading/ReadingPage").then((module) => ({ default: module.ReadingPage })));
const GoalsPage = lazy(() => import("@/features/goals/GoalsPage").then((module) => ({ default: module.GoalsPage })));
const UserGoalPage = lazy(() => import("@/features/goals/UserGoalPage").then((module) => ({ default: module.UserGoalPage })));
const UpcomingTasksPage = lazy(() => import("@/features/goals/UpcomingTasksPage").then((module) => ({ default: module.UpcomingTasksPage })));
const TodosPage = lazy(() => import("@/features/todos/TodosPage").then((module) => ({ default: module.TodosPage })));
const FitnessPage = lazy(() => import("@/features/fitness/FitnessPage").then((module) => ({ default: module.FitnessPage })));
const ProfilePage = lazy(() => import("@/features/profile/ProfilePage").then((module) => ({ default: module.ProfilePage })));

const AchievementsPage = lazy(() => import("@/features/achievements/AchievementPage").then((module) => ({ default: module.AchievementsPage })));
const UpgradePage = lazy(() => import("@/features/subscription/UpgradePage").then((module) => ({ default: module.UpgradePage })));
const WeeklyReportPage = lazy(() => import("@/features/dashboard/WeeklyReportPage").then((module) => ({ default: module.WeeklyReportPage })));

const routeLoadingFallback = <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

const withRouteSuspense = (element: React.ReactNode) => (
  <Suspense fallback={routeLoadingFallback}>{element}</Suspense>
);

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <SpeedInsights />
      <AuthProvider>
        <Routes>
          {/* ── PUBLIC ────────────────────────────────────────── */}
          <Route
            path="/"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RedirectIfAuth>
                  <LandingPage />
                </RedirectIfAuth>
              </Suspense>
            }
          />
          <Route
            path="/auth"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RedirectIfAuth>
                  <LoginPage />
                </RedirectIfAuth>
              </Suspense>
            }
          />
          <Route
            path="/auth/callback"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AuthCallbackPage />
              </Suspense>
            }
          />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={<RouteFallback />}>
                <PrivacyPage />
              </Suspense>
            }
          />
          <Route
            path="/terms"
            element={
              <Suspense fallback={<RouteFallback />}>
                <TermsPage />
              </Suspense>
            }
          />

          {/* ── PROTECTED APP ─────────────────────────────────── */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <GoalStoreProvider>
                    <Suspense fallback={<RouteFallback />}>
                      <AppLayout />
                    </Suspense>
                  </GoalStoreProvider>
                </RequireOnboarding>
              </RequireAuth>
            }
          >
            <Route index element={withRouteSuspense(<DashboardPage />)} />

            <Route path="nutrition" element={withRouteSuspense(<NutritionPage />)} />
            <Route path="schedule" element={withRouteSuspense(<SchedulePage />)} />
            <Route path="reading" element={withRouteSuspense(<ReadingPage />)} />

            <Route path="goals" element={withRouteSuspense(<GoalsPage />)} />
            <Route path="goals/:goalId" element={withRouteSuspense(<UserGoalPage />)} />

            <Route path="upcoming" element={withRouteSuspense(<UpcomingTasksPage />)} />
            <Route path="todos" element={withRouteSuspense(<TodosPage />)} />
            <Route path="fitness" element={withRouteSuspense(<FitnessPage />)} />
            <Route path="profile" element={withRouteSuspense(<ProfilePage />)} />
            <Route path="achievements" element={withRouteSuspense(<AchievementsPage />)} />
            <Route path="upgrade" element={withRouteSuspense(<UpgradePage />)} />
            <Route path="weekly-report" element={withRouteSuspense(<WeeklyReportPage />)} />

            <Route path="daily-plan" element={<Navigate to="/app" replace />} />
          </Route>

          {/* ── FALLBACK ──────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
