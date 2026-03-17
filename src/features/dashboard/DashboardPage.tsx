import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { Apple, BookOpen, Dumbbell, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

import { DashboardStartHereCard } from "./components/DashboardStartHereCard";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import { useProfile } from "../onboarding/useProfile";
import { useTier, tierMeets } from "@/features/subscription/useTier";
import { loadUserGoals, seedUserGoals } from "@/features/goals/userGoalStorage";
import { scheduleIdle } from "@/lib/scheduleIdle";

import {
  AICoachCardSkeleton,
  AchievementsCardSkeleton,
  FitnessCardSkeleton,
  LifeProgressCardSkeleton,
  MacrosCardSkeleton,
  ReadingCardSkeleton,
  ScheduleCardSkeleton,
  SpendingCardSkeleton,
  TodoCardSkeleton,
  UpcomingGoalsCardSkeleton,
  WaterIntakeCardSkeleton,
  WeeklyReportCardSkeleton,
} from "./skeletons";

const AICoachCard = lazy(async () => ({
  default: (await import("./components/AICoachCard")).AICoachCard,
}));
const AIUsagePill = lazy(async () => ({
  default: (await import("@/features/subscription/AIUsagePill")).AIUsagePill,
}));
const ReadingCard = lazy(async () => ({
  default: (await import("./components/ReadingCard")).ReadingCard,
}));
const MacrosCard = lazy(async () => ({
  default: (await import("./components/MacrosCard")).MacrosCard,
}));
const ScheduleCard = lazy(async () => ({
  default: (await import("./components/ScheduleCard")).ScheduleCard,
}));
const UpcomingGoalsCard = lazy(async () => ({
  default: (await import("./components/UpcomingGoalsCard")).UpcomingGoalsCard,
}));
const SpendingCard = lazy(async () => ({
  default: (await import("./components/SpendingCard")).SpendingCard,
}));
const TodoCard = lazy(async () => ({
  default: (await import("./components/TodoCard")).TodoCard,
}));
const FitnessCard = lazy(async () => ({
  default: (await import("./components/FitnessCard")).FitnessCard,
}));
const WaterIntakeCard = lazy(async () => ({
  default: (await import("./components/WaterIntakeCard")).WaterIntakeCard,
}));
const LifeProgressCard = lazy(async () => ({
  default: (await import("./components/LifeProgressCard")).LifeProgressCard,
}));
const AchievementsCard = lazy(async () => ({
  default: (await import("./components/AchievementsCard")).AchievementsCard,
}));
const WeeklyReportCard = lazy(async () => ({
  default: (await import("./components/WeeklyReportCard")).WeeklyReportCard,
}));

function useDeferredMount(delay = 0) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cancel = scheduleIdle(() => setReady(true), delay);
    return cancel;
  }, [delay]);

  return ready;
}

function UsagePillPlaceholder() {
  return <div className="h-10 w-[190px] rounded-full border bg-card/70" />;
}

function QuickAction({
  icon,
  label,
  sub,
  href,
  color,
}: {
  icon: ReactNode;
  label: string;
  sub: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      to={href}
      className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-sm hover:ring-1 hover:ring-border"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight">{label}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
      <Zap className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
    </Link>
  );
}

export default function DashboardPage() {
  const profile = useProfile();
  const firstName = profile?.display_name?.trim().split(/\s+/)[0] ?? "";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const { modules } = useEnabledModules();
  const tier = useTier();
  const isPro = tierMeets(tier, "pro");
  const has = useCallback((id: string) => modules.has(id as never), [modules]);

  const [goalCount, setGoalCount] = useState<number | null>(() => {
    return seedUserGoals().length;
  });

  const showTopEnhancements = useDeferredMount(160);
  const showSecondaryEnhancements = useDeferredMount(380);

  useEffect(() => {
    let cancelled = false;

    loadUserGoals().then((fresh) => {
      if (cancelled) return;
      setGoalCount(fresh.length);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const showEmptyState = goalCount === 0;

  const quickActions = useMemo(
    () =>
      [
        has("nutrition") && {
          icon: <Apple className="h-4 w-4" />,
          label: "Log a meal",
          sub: "Nutrition tab",
          href: "/app/nutrition",
          color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        },
        has("reading") && {
          icon: <BookOpen className="h-4 w-4" />,
          label: "Update pages",
          sub: "Reading tab",
          href: "/app/reading",
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        },
        has("fitness") && {
          icon: <Dumbbell className="h-4 w-4" />,
          label: "Log a PR",
          sub: "Fitness",
          href: "/app/fitness",
          color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
        },
        has("goals") && {
          icon: <TrendingUp className="h-4 w-4" />,
          label: "Review goals",
          sub: "Upcoming tasks",
          href: "/app/upcoming",
          color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        },
      ].filter(Boolean) as {
        icon: ReactNode;
        label: string;
        sub: string;
        href: string;
        color: string;
      }[],
    [has]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {today}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
            {greeting}
            {firstName ? ` ${firstName}` : ""} 👋
          </h1>
        </div>

        <Suspense fallback={<UsagePillPlaceholder />}>
          {showTopEnhancements ? <AIUsagePill /> : <UsagePillPlaceholder />}
        </Suspense>
      </div>

      <div className="space-y-4">
        {showEmptyState && <DashboardStartHereCard />}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
          <Suspense fallback={<AICoachCardSkeleton />}>
            {showTopEnhancements ? <AICoachCard /> : <AICoachCardSkeleton />}
          </Suspense>

          {quickActions.length > 0 && (
            <div className="md:col-span-2 lg:col-span-12">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                {quickActions.map((qa) => (
                  <QuickAction key={qa.href} {...qa} />
                ))}
              </div>
            </div>
          )}

          <Suspense fallback={<LifeProgressCardSkeleton />}>
            {showTopEnhancements ? <LifeProgressCard /> : <LifeProgressCardSkeleton />}
          </Suspense>
        </div>

        {(has("schedule") || has("goals")) && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
            {has("schedule") && (
              <Suspense fallback={<ScheduleCardSkeleton />}>
                {showTopEnhancements ? <ScheduleCard /> : <ScheduleCardSkeleton />}
              </Suspense>
            )}

            {has("goals") && (
              <Suspense fallback={<UpcomingGoalsCardSkeleton />}>
                {showTopEnhancements ? (
                  <UpcomingGoalsCard />
                ) : (
                  <UpcomingGoalsCardSkeleton />
                )}
              </Suspense>
            )}
          </div>
        )}

        {(has("nutrition") || has("reading")) && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
            {has("nutrition") && (
              <Suspense fallback={<MacrosCardSkeleton />}>
                {showTopEnhancements ? <MacrosCard /> : <MacrosCardSkeleton />}
              </Suspense>
            )}

            {has("reading") && (
              <Suspense fallback={<ReadingCardSkeleton />}>
                {showTopEnhancements ? <ReadingCard /> : <ReadingCardSkeleton />}
              </Suspense>
            )}
          </div>
        )}

        {(isPro || has("finance")) && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
            {isPro && (
              <Suspense fallback={<WeeklyReportCardSkeleton />}>
                {showSecondaryEnhancements ? (
                  <WeeklyReportCard />
                ) : (
                  <WeeklyReportCardSkeleton />
                )}
              </Suspense>
            )}

            {has("finance") && (
              <Suspense fallback={<SpendingCardSkeleton />}>
                {showSecondaryEnhancements ? <SpendingCard /> : <SpendingCardSkeleton />}
              </Suspense>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
          {has("fitness") && (
            <Suspense fallback={<FitnessCardSkeleton />}>
              {showSecondaryEnhancements ? <FitnessCard /> : <FitnessCardSkeleton />}
            </Suspense>
          )}

          {has("nutrition") && (
            <Suspense fallback={<WaterIntakeCardSkeleton />}>
              {showSecondaryEnhancements ? (
                <WaterIntakeCard />
              ) : (
                <WaterIntakeCardSkeleton />
              )}
            </Suspense>
          )}

          <Suspense fallback={<AchievementsCardSkeleton />}>
            {showSecondaryEnhancements ? (
              <AchievementsCard />
            ) : (
              <AchievementsCardSkeleton />
            )}
          </Suspense>

          {has("todos") && (
            <Suspense fallback={<TodoCardSkeleton />}>
              {showSecondaryEnhancements ? <TodoCard /> : <TodoCardSkeleton />}
            </Suspense>
          )}
        </div>
      </div>

      {modules.size === 0 && (
        <div className="space-y-3 rounded-2xl border border-dashed p-12 text-center">
          <p className="text-lg font-semibold">No modules enabled</p>
          <p className="text-sm text-muted-foreground">
            Go to Profile settings to choose what you want to track.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link to="/app/profile">Open settings</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
