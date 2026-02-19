import { Link } from "react-router-dom";
import { Apple, BookOpen, Dumbbell, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ReadingCard } from "./cards/ReadingCard";
import { MacrosCard } from "./cards/MacrosCard";
import { ScheduleCard } from "./cards/ScheduleCard";
import { UpcomingGoalsCard } from "./cards/UpcomingGoalsCard";
import { SpendingCard } from "./cards/SpendingCard";

// ─── Quick action strip ───────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {today}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">{greeting} 👋</h1>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/daily-plan/nutrition">Log food</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/daily-plan/reading">Update reading</Link>
          </Button>
        </div>
      </div>

      {/* ── Bento grid ──────────────────────────────────────────────────────────
        lg:  [ Reading  (5) ] [   Macros    (7) ]
             [ Schedule (7) ] [ Goals       (5) ]
        md:  2-col equal
        sm:  single col stacked
      ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        <ReadingCard />
        <MacrosCard />
        <ScheduleCard />
        <UpcomingGoalsCard />
        <SpendingCard />

        {/* ── Quick actions strip ── */}
        <div className="md:col-span-2 lg:col-span-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickAction
              icon={<Apple className="h-4 w-4" />}
              label="Log a meal"
              sub="Nutrition tab"
              href="/daily-plan/nutrition"
              color="bg-orange-500/10 text-orange-600 dark:text-orange-400"
            />
            <QuickAction
              icon={<BookOpen className="h-4 w-4" />}
              label="Update pages"
              sub="Reading tab"
              href="/daily-plan/reading"
              color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <QuickAction
              icon={<Dumbbell className="h-4 w-4" />}
              label="Log workout"
              sub="Coming soon"
              href="/daily-plan/schedule"
              color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            />
            <QuickAction
              icon={<TrendingUp className="h-4 w-4" />}
              label="Review goals"
              sub="Goals tab"
              href="/daily-plan/upcoming"
              color="bg-rose-500/10 text-rose-600 dark:text-rose-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}