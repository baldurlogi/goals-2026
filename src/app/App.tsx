import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "./providers/AuthProvider";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RedirectIfAuth } from "@/features/auth/RedirectIfAuth";
import { RequireOnboarding } from "@/features/onboarding/RequireOnboarding";
import { Skeleton, WidgetCardSkeleton } from "@/features/dashboard/skeletons";
import { CookieConsentBanner } from "@/features/legal/CookieConsentBanner";
import { NativeAuthBridge } from "@/features/auth/NativeAuthBridge";
import {
  readCookieConsent,
  subscribeCookieConsent,
} from "@/features/legal/cookieConsent";
import { syncAnalyticsConsent } from "@/lib/analyticsClient";

const AppLayout = lazy(async () => ({
  default: (await import("@/app/AppLayout")).AppLayout,
}));

const LandingPage = lazy(async () => ({
  default: (await import("@/features/landing/LandingPage")).LandingPage,
}));

const WaitlistConfirmPage = lazy(() => import("@/features/landing/WaitlistConfirmPage"));

const LoginPage = lazy(async () => ({
  default: (await import("@/features/auth/LoginPage")).LoginPage,
}));

const SignupPage = lazy(async () => ({
  default: (await import("@/features/auth/SignupPage")).SignupPage,
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

const SleepPage = lazy(() => import("@/features/sleep/SleepPage"));

const WellbeingPage = lazy(() => import("@/features/wellbeing/WellbeingPage"));

const ReadingPage = lazy(async () => ({
  default: (await import("@/features/reading/ReadingPage")).ReadingPage,
}));

const GoalsPage = lazy(async () => ({
  default: (await import("@/features/goals/GoalsPage")).GoalsPage,
}));

const GoalCreatePage = lazy(async () => ({
  default: (await import("@/features/goals/GoalCreatePage")).GoalCreatePage,
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

const FinancePage = lazy(() => import("@/features/finance/FinancePage"));

const SkincarePage = lazy(() => import("@/features/skincare/SkincarePage"));

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

const LifeProgressPage = lazy(() => import("@/features/dashboard/LifeProgressPage"));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 border-b bg-background/95">
        <div className="flex h-14 items-center gap-3 px-4 lg:px-10">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-8 w-36 rounded-md" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </div>

      <div className="w-full space-y-6 px-4 py-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-72 max-w-[80vw]" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <WidgetCardSkeleton rows={5} />
          <WidgetCardSkeleton rows={5} />
          <WidgetCardSkeleton rows={4} />
          <WidgetCardSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}

function AppRouteFallback() {
  return (
    <div className="w-full min-h-[560px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-80 max-w-[85vw]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetCardSkeleton rows={4} />
        <WidgetCardSkeleton rows={4} />
      </div>

      <WidgetCardSkeleton rows={5} />
    </div>
  );
}

function ConsentAwareAnalytics() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    () => readCookieConsent()?.analytics === true,
  );

  useEffect(() => {
    syncAnalyticsConsent(analyticsEnabled);
  }, [analyticsEnabled]);

  useEffect(
    () =>
      subscribeCookieConsent((state) => {
        setAnalyticsEnabled(state?.analytics === true);
      }),
    [],
  );

  if (!analyticsEnabled) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NativeAuthBridge />
      <ConsentAwareAnalytics />
      <AuthProvider>
        <Routes>
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
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="/waitlist/confirm"
            element={
              <Suspense fallback={<RouteFallback />}>
                <WaitlistConfirmPage />
              </Suspense>
            }
          />

          <Route
            path="/login"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RedirectIfAuth>
                  <LoginPage />
                </RedirectIfAuth>
              </Suspense>
            }
          />

          <Route
            path="/signup"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RedirectIfAuth>
                  <SignupPage />
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

          <Route
            path="/app"
            element={
              <RequireAuth>
                <RequireOnboarding>
                  <Suspense fallback={<RouteFallback />}>
                    <AppLayout />
                  </Suspense>
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
              path="sleep"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <SleepPage />
                </Suspense>
              }
            />
            <Route
              path="wellbeing"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <WellbeingPage />
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
              path="finance"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <FinancePage />
                </Suspense>
              }
            />
            <Route
              path="skincare"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <SkincarePage />
                </Suspense>
              }
            />
            <Route
              path="goals/finance"
              element={<Navigate to="/app/finance" replace />}
            />
            <Route
              path="goals/skincare"
              element={<Navigate to="/app/skincare" replace />}
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
              path="goals/new"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <GoalCreatePage mode="manual" />
                </Suspense>
              }
            />
            <Route
              path="goals/ai"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <GoalCreatePage mode="ai" />
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
            <Route
              path="progress"
              element={
                <Suspense fallback={<AppRouteFallback />}>
                  <LifeProgressPage />
                </Suspense>
              }
            />
            <Route path="daily-plan" element={<Navigate to="/app" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <CookieConsentBanner />
      </AuthProvider>
    </BrowserRouter>
  );
}
