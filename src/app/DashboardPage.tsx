/**
 * DashboardPage.tsx  — full bento redesign
 *
 * Cards:
 *  1. Reading Now          (wired — existing)
 *  2. Macros Today         (wired — nutrition storage)
 *  3. Today's Schedule     (stubbed — ready to wire)
 *  4. Upcoming Goals       (stubbed — ready to wire)
 *  5. Quick Actions        (small utility strip)
 */

import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Reading
import {
  loadReadingInputs,
  READING_CHANGED_EVENT,
} from "@/features/reading/readingStorage";
import { inputsToPlan, getReadingStats } from "@/features/reading/readingUtils";

// Nutrition
import {
  loadNutritionLog,
  getLoggedMacros,
  getPlannedMacros,
  NUTRITION_CHANGED_EVENT,
} from "@/features/nutrition/nutritionStorage";
import { nutritionTarget } from "@/features/nutrition/nutritionData";

// ─── icons (lucide — already in your stack) ─────────────────────────────────
import {
  BookOpen,
  Flame,
  CalendarDays,
  Target,
  ChevronRight,
  TrendingUp,
  Clock,
  Zap,
  Apple,
  Dumbbell,
} from "lucide-react";

// ─── tiny helpers ────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100) {
  return Math.min(Math.max(val, min), max);
}

function pct(value: number, target: number) {
  if (target <= 0) return 0;
  return clamp(Math.round((value / target) * 100));
}

// ─── sub-components ──────────────────────────────────────────────────────────

/** Thin progress bar row used inside the macros card */
function MacroPill({
  label,
  value,
  target,
  unit,
  color,
  plannedValue,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  plannedValue: number;
}) {
  const loggedPct = pct(value, target);
  const plannedPct = pct(plannedValue, target);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
          {label}
        </span>
        <span className="tabular-nums">
          <span className="font-semibold">{value}</span>
          <span className="text-muted-foreground">/{target}{unit}</span>
        </span>
      </div>

      {/* stacked bars: planned (ghost) then logged (solid) */}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        {/* planned bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-20"
          style={{ width: `${plannedPct}%`, background: color }}
        />
        {/* logged bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${loggedPct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/** Schedule time row */
function ScheduleRow({
  time,
  label,
  isNext,
}: {
  time: string;
  label: string;
  isNext?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
        isNext ? "bg-primary/8 ring-1 ring-primary/20" : ""
      }`}
    >
      <span className="w-11 shrink-0 text-xs tabular-nums text-muted-foreground">
        {time}
      </span>
      <span className={`flex-1 text-sm ${isNext ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
      {isNext && (
        <Badge className="h-4 shrink-0 bg-primary/15 px-1.5 text-[10px] text-primary hover:bg-primary/15">
          next
        </Badge>
      )}
    </div>
  );
}

/** Goal row in upcoming card */
function GoalRow({
  emoji,
  goal,
  step,
  due,
  badge,
  overdue,
}: {
  emoji: string;
  goal: string;
  step: string;
  due: string;
  badge: string;
  overdue?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-1">
      <span className="mt-0.5 text-base leading-none">{emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-tight truncate">{step}</div>
        <div className="mt-0.5 text-xs text-muted-foreground truncate">
          {goal} · due {due}
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
          overdue
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {badge}
      </span>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // ── Reading ──────────────────────────────────────────────────────────────
  const [readingInputs, setReadingInputs] = useState(() => loadReadingInputs());

  useEffect(() => {
    const sync = () => setReadingInputs(loadReadingInputs());
    window.addEventListener(READING_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(READING_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const readingStats = useMemo(
    () => getReadingStats(inputsToPlan(readingInputs)),
    [readingInputs],
  );

  const hasReading =
    readingStats.current.title.trim() ||
    readingStats.current.author.trim() ||
    readingInputs.current.totalPages.trim() ||
    readingInputs.current.currentPage.trim();

  // ── Nutrition ─────────────────────────────────────────────────────────────
  const [nutritionLog, setNutritionLog] = useState(() => loadNutritionLog());

  useEffect(() => {
    const sync = () => setNutritionLog(loadNutritionLog());
    window.addEventListener(NUTRITION_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NUTRITION_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const logged = useMemo(() => getLoggedMacros(nutritionLog), [nutritionLog]);
  const planned = useMemo(() => getPlannedMacros(1), []);

  const calLoggedPct = pct(logged.cal, nutritionTarget.calories);
  const mealsEaten = Object.values(nutritionLog.eaten).filter(Boolean).length;
  const totalMeals = 5; // breakfast + lunch + snack + shake + dinner

  // ── Stubs (schedule & goals) ──────────────────────────────────────────────
  const todaySchedule = {
    nextLabel: "Gym",
    nextTime: "18:00",
    items: [
      { time: "09:00", label: "Work deep block" },
      { time: "12:30", label: "Lunch" },
      { time: "18:00", label: "Gym" },
      { time: "20:00", label: "Dinner" },
      { time: "22:00", label: "Wind down" },
    ],
    nextIndex: 2,
  };

  const upcoming = {
    horizon: 14,
    overdueCount: 1,
    items: [
      { emoji: "📖", goal: "Reading", step: "Finish current book", due: "Feb 20", badge: "in 3d", overdue: false },
      { emoji: "🏃", goal: "Marathon", step: "Long run 22 km", due: "Feb 18", badge: "tomorrow", overdue: false },
      { emoji: "💼", goal: "SaaS", step: "Landing page draft", due: "Feb 15", badge: "2d overdue", overdue: true },
      { emoji: "💪", goal: "Strength", step: "Hit 100kg squat", due: "Feb 28", badge: "in 11d", overdue: false },
    ],
  };

  // ── today's greeting ──────────────────────────────────────────────────────
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

      {/* ── Bento grid ── */}
      {/*
        Layout (lg):
          [  Reading (5)  ] [    Macros (7)    ]
          [ Schedule (7)  ] [   Goals   (5)    ]

        On md: 2-col equal. On mobile: single col stacked.
      */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">

        {/* ══ 1. Reading Now ══════════════════════════════════════════════════ */}
        <Card className="group relative overflow-hidden lg:col-span-5">
          {/* decorative top stripe */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          <CardHeader className="pb-2 pt-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Reading now
              </span>
            </div>

            {hasReading ? (
              <>
                <p className="mt-2 text-base font-bold leading-tight">
                  {readingStats.current.title || "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {readingStats.current.author || "Unknown author"}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-base font-bold">No book set</p>
                <p className="text-xs text-muted-foreground">
                  Add your current book to track progress.
                </p>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-3 pb-5">
            {hasReading ? (
              <>
                <div className="relative">
                  <Progress
                    value={readingStats.pct}
                    className="h-2.5 rounded-full"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Stat
                    label="Progress"
                    value={`${readingStats.pct}%`}
                    color="text-emerald-500"
                  />
                  <Stat label="Pages left" value={String(readingStats.pagesLeft)} />
                  <Stat
                    label="Est. finish"
                    value={`${readingStats.daysToFinishCurrent}d`}
                    color="text-teal-500"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Daily goal:{" "}
                    <span className="font-semibold text-foreground">
                      {readingStats.dailyGoalPages} pages
                    </span>
                  </p>
                  <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                    <Link to="/daily-plan/reading">
                      Open <ChevronRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <Button asChild size="sm" className="w-full">
                <Link to="/daily-plan/reading">Set up reading</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ══ 2. Macros Today ═════════════════════════════════════════════════ */}
        <Card className="relative overflow-hidden lg:col-span-7">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400" />

          <CardHeader className="pb-2 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Macros today
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {mealsEaten}/{totalMeals} meals logged
              </span>
            </div>

            {/* big calorie number */}
            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-bold tabular-nums leading-none">
                {logged.cal}
              </span>
              <span className="mb-0.5 text-sm text-muted-foreground">
                / {nutritionTarget.calories} kcal
              </span>
              <span className="mb-0.5 ml-auto text-xs text-muted-foreground">
                plan: {planned.cal}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pb-5">
            {/* main calorie bar */}
            <div className="relative h-3 overflow-hidden rounded-full bg-muted">
              {/* planned ghost bar */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-orange-500/20 transition-all duration-700"
                style={{ width: `${pct(planned.cal, nutritionTarget.calories)}%` }}
              />
              {/* logged bar */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                style={{ width: `${calLoggedPct}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <MacroPill
                label="Protein"
                value={logged.protein}
                target={nutritionTarget.protein}
                unit="g"
                color="#22c55e"
                plannedValue={planned.protein}
              />
              <MacroPill
                label="Carbs"
                value={logged.carbs}
                target={nutritionTarget.carbs}
                unit="g"
                color="#3b82f6"
                plannedValue={planned.carbs}
              />
              <MacroPill
                label="Fat"
                value={logged.fat}
                target={nutritionTarget.fat}
                unit="g"
                color="#a855f7"
                plannedValue={planned.fat}
              />
            </div>

            {/* remaining vs target note */}
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">
                {logged.cal === 0 ? (
                  <>No meals logged yet — head to <strong>Nutrition</strong> to check off meals as you eat.</>
                ) : nutritionTarget.calories - logged.cal > 0 ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {nutritionTarget.calories - logged.cal} kcal
                    </span>{" "}
                    remaining to target ·{" "}
                    <span className="font-semibold text-foreground">
                      {nutritionTarget.protein - logged.protein}g protein
                    </span>{" "}
                    to go
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-orange-500">Over target</span> by{" "}
                    {logged.cal - nutritionTarget.calories} kcal
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {logged.protein >= nutritionTarget.protein && (
                  <Badge className="h-5 bg-emerald-500/10 px-2 text-[10px] text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                    ✓ Protein goal
                  </Badge>
                )}
                {logged.cal >= nutritionTarget.calories && (
                  <Badge className="h-5 bg-amber-500/10 px-2 text-[10px] text-amber-600 hover:bg-amber-500/10 dark:text-amber-400">
                    ✓ Cal target
                  </Badge>
                )}
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Link to="/daily-plan/nutrition">
                  Log food <ChevronRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ══ 3. Today's Schedule ═════════════════════════════════════════════ */}
        <Card className="relative overflow-hidden lg:col-span-7">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400" />

          <CardHeader className="pb-2 pt-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Today's schedule
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Next:{" "}
                <span className="font-bold text-foreground">
                  {todaySchedule.nextLabel}
                </span>{" "}
                · {todaySchedule.nextTime}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-0.5 pb-5">
            {todaySchedule.items.map((item, i) => (
              <ScheduleRow
                key={item.time}
                time={item.time}
                label={item.label}
                isNext={i === todaySchedule.nextIndex}
              />
            ))}

            <div className="flex justify-end pt-2">
              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Link to="/daily-plan/schedule">
                  Full week <ChevronRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ══ 4. Upcoming Goals ═══════════════════════════════════════════════ */}
        <Card className="relative overflow-hidden lg:col-span-5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-rose-500 via-pink-400 to-orange-400" />

          <CardHeader className="pb-2 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Upcoming goals
                </span>
              </div>
              {upcoming.overdueCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-4 px-1.5 text-[10px]"
                >
                  {upcoming.overdueCount} overdue
                </Badge>
              )}
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Next <span className="font-semibold text-foreground">{upcoming.horizon} days</span>
            </p>
          </CardHeader>

          <CardContent className="space-y-0.5 pb-5">
            <div className="divide-y divide-border/50">
              {upcoming.items.map((it, i) => (
                <GoalRow key={i} {...it} />
              ))}
            </div>

            <div className="flex justify-end pt-3">
              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Link to="/daily-plan/upcoming">
                  All goals <ChevronRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ══ 5. Quick actions strip (full-width at bottom) ════════════════════ */}
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

// ─── tiny presentational atoms ───────────────────────────────────────────────

function Stat({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
      <div className={`text-base font-bold tabular-nums ${color}`}>{value}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

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