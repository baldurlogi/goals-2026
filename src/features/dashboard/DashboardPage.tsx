import { Link } from "react-router-dom";
import { Apple, BookOpen, Dumbbell, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ReadingCard } from "./components/ReadingCard";
import { MacrosCard } from "./components/MacrosCard";
import { ScheduleCard } from "./components/ScheduleCard";
import { UpcomingGoalsCard } from "./components/UpcomingGoalsCard";
import { SpendingCard } from "./components/SpendingCard";
import { TodoCard } from "./components/TodoCard";
import { FitnessCard } from "./components/FitnessCard";
import { AICoachCard } from "./components/AICoachCard";
import { WaterIntakeCard } from "./components/WaterIntakeCard";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import { useProfile } from "../onboarding/useProfile";

function QuickAction({
  icon,
  label,
  sub,
  href,
  color,
}: {
  icon: React.ReactNode;
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
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
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

  const has = (id: string) => modules.has(id as never);

  const quickActions = [
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
    icon: React.ReactNode;
    label: string;
    sub: string;
    href: string;
    color: string;
  }[];

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

        <div className="flex gap-2">
          {has("nutrition") && (
            <Button asChild variant="outline" size="sm">
              <Link to="/app/nutrition">Log food</Link>
            </Button>
          )}
          {has("reading") && (
            <Button asChild size="sm">
              <Link to="/app/reading">Update reading</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        <AICoachCard />
        {has("reading") && <ReadingCard />}
        {has("nutrition") && <MacrosCard />}
        {has("schedule") && <ScheduleCard />}
        {has("goals") && <UpcomingGoalsCard />}
        {has("finance") && <SpendingCard />}
        {has("todos") && <TodoCard />}
        {has("fitness") && <FitnessCard />}
        {has("nutrition") && <WaterIntakeCard />}

        {quickActions.length > 0 && (
          <div className="md:col-span-2 lg:col-span-12">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {quickActions.map((qa) => (
                <QuickAction key={qa.href} {...qa} />
              ))}
            </div>
          </div>
        )}
      </div>

      {modules.size === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center space-y-3">
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