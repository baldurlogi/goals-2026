import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { GoalStoreProvider } from "@/features/goals/goalStore";
import { AuthProvider } from "./providers/AuthProvider";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RedirectIfAuth } from "@/features/auth/RedirectIfAuth";
import { RequireOnboarding } from "@/features/onboarding/RequireOnboarding";

const AppLayout = lazy(async () => ({
  default: (await import("@/app/AppLayout")).AppLayout,
}));

const LandingPage = lazy(async () => ({
  default: (await import("@/features/landing/LandingPage")).LandingPage,
}));

const LoginPage = lazy(async () => ({
  default: (await import("@/features/auth/LoginPage")).LoginPage,
}));

const AuthCallbackPage = lazy(async () => ({
  default: (await import("@/features/auth/AuthCallbackPage")).AuthCallbackPage,
}));

const PrivacyPage = lazy(async () => ({
  default: (await import("@/features/legal/PrivacyPage")).PrivacyPage,
}));

const TermsPage = lazy(async () => ({
  default: (await import("@/features/legal/TermsPage")).TermsPage,
}));

const NutritionPage = lazy(async () => ({
  default: (await import("@/features/nutrition/NutritionPage")).NutritionPage,
}));

const SchedulePage = lazy(async () => ({
  default: (await import("@/features/schedule/SchedulePage")).SchedulePage,
}));

const ReadingPage = lazy(async () => ({
  default: (await import("@/features/reading/ReadingPage")).ReadingPage,
}));

const GoalsPage = lazy(async () => ({
  default: (await import("@/features/goals/GoalsPage")).GoalsPage,
}));

const UpcomingTasksPage = lazy(async () => ({
  default: (await import("@/features/goals/UpcomingTasksPage")).UpcomingTasksPage,
}));

const UserGoalPage = lazy(async () => ({
  default: (await import("@/features/goals/UserGoalPage")).UserGoalPage,
}));

const TodosPage = lazy(async () => ({
  default: (await import("@/features/todos/TodosPage")).TodosPage,
}));

const FitnessPage = lazy(async () => ({
  default: (await import("@/features/fitness/FitnessPage")).FitnessPage,
}));

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));

const ProfilePage = lazy(async () => ({
  default: (await import("@/features/profile/ProfilePage")).ProfilePage,
}));

const AchievementsPage = lazy(async () => ({
  default: (await import("@/features/achievements/AchievementPage"))
    .AchievementsPage,
}));

const UpgradePage = lazy(async () => ({
  default: (await import("@/features/subscription/UpgradePage")).UpgradePage,
}));

const WeeklyReportPage = lazy(async () => ({
  default: (await import("@/features/dashboard/WeeklyReportPage"))
    .WeeklyReportPage,
}));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground lg:px-10">
        Loading…
      </div>
    </div>
  );
}

function AppRouteFallback() {
  return (
    <div className="w-full rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

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
            <Route
              index
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <DashboardPage />
                </Suspense>
              }
            />

            <Route
              path="nutrition"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <NutritionPage />
                </Suspense>
              }
            />
            <Route
              path="schedule"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <SchedulePage />
                </Suspense>
              }
            />
            <Route
              path="reading"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <ReadingPage />
                </Suspense>
              }
            />

            <Route
              path="goals"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <GoalsPage />
                </Suspense>
              }
            />
            <Route
              path="goals/:goalId"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <UserGoalPage />
                </Suspense>
              }
            />

            <Route
              path="upcoming"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <UpcomingTasksPage />
                </Suspense>
              }
            />
            <Route
              path="todos"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <TodosPage />
                </Suspense>
              }
            />
            <Route
              path="fitness"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <FitnessPage />
                </Suspense>
              }
            />
            <Route
              path="profile"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <ProfilePage />
                </Suspense>
              }
            />
            <Route
              path="achievements"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <AchievementsPage />
                </Suspense>
              }
            />
            <Route
              path="upgrade"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <UpgradePage />
                </Suspense>
              }
            />
            <Route
              path="weekly-report"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <WeeklyReportPage />
                </Suspense>
              }
            />

            <Route path="daily-plan" element={<Navigate to="/app" replace />} />
          </Route>

          {/* ── FALLBACK ──────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}