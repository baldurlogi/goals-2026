import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  Apple,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Coffee,
  Droplets,
  Dumbbell,
  Heart,
  Moon,
  Sparkles,
  SunMedium,
  Sunset,
  Target,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { DashboardStartHereCard } from "./components/DashboardStartHereCard";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import { useProfileQuery } from "../onboarding/useProfileQuery";
import { useTier, tierMeets } from "@/features/subscription/useTier";
import { useGoalsState } from "@/features/goals/useGoalsQuery";
import { scheduleIdle } from "@/lib/scheduleIdle";
import { capture } from "@/lib/analytics";
import {
  formatDateWithPreferences,
  formatTimeStringWithPreferences,
} from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";
import { useLifeProgress } from "./useLifeProgress";
import { useGoalsDashboard } from "./hooks/useGoalsDashboard";
import { useScheduleDashboard } from "./hooks/useScheduleDashboard";
import { useNutritionDashboard } from "./hooks/useNutritionDashboard";
import { useReadingDashboard } from "./hooks/useReadingDashboard";
import { useSleepDashboard } from "./hooks/useSleepDashboard";
import { useWellbeingDashboard } from "./hooks/useWellbeingDashboard";
import { useFitnessDashboard } from "./hooks/useFitnessDashboard";
import { useSpendingDashboard } from "./hooks/useSpendingDashboard";
import { useTodoDashboard } from "./hooks/useTodoDashboard";
import { useSkincareDashboard } from "./hooks/useSkincareDashboard";

import {
  AICoachCardSkeleton,
  AchievementsCardSkeleton,
  FitnessCardSkeleton,
  LifeProgressCardSkeleton,
  MacrosCardSkeleton,
  ReadingCardSkeleton,
  ScheduleCardSkeleton,
  SleepCardSkeleton,
  SpendingCardSkeleton,
  TodoCardSkeleton,
  UpcomingGoalsCardSkeleton,
  WaterIntakeCardSkeleton,
  WellbeingCardSkeleton,
  WeeklyReportCardSkeleton,
} from "./skeletons";

const AICoachCard = lazy(async () => ({
  default: (await import("./components/AICoachCard")).AICoachCard,
}));
const ReadingCard = lazy(async () => ({
  default: (await import("./components/ReadingCard")).ReadingCard,
}));
const SleepCard = lazy(async () => ({
  default: (await import("./components/SleepCard")).SleepCard,
}));
const WellbeingCard = lazy(async () => ({
  default: (await import("./components/WellbeingCard")).WellbeingCard,
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
const SkincareCard = lazy(async () => ({
  default: (await import("./components/SkincareCard")).SkincareCard,
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

function formatDkk(n: number) {
  return new Intl.NumberFormat("da-DK").format(Math.round(n));
}

function getMomentumLabel(score: number) {
  if (score >= 85) return "Strong current";
  if (score >= 60) return "Steady rhythm";
  if (score >= 35) return "Momentum forming";
  return "Quiet start";
}

function getMomentumTone(score: number) {
  if (score >= 85) return "rgba(34,197,94,0.42)";
  if (score >= 60) return "rgba(20,184,166,0.34)";
  if (score >= 35) return "rgba(139,92,246,0.30)";
  return "rgba(148,163,184,0.22)";
}

function getMomentumMotionClass(score: number, loading = false) {
  if (loading) return "ai-momentum-low";
  if (score >= 80) return "ai-momentum-high";
  if (score >= 45) return "ai-momentum-mid";
  return "ai-momentum-low";
}

type DayPhase = "morning" | "afternoon" | "evening";

type AdaptiveCue = {
  label: string;
  title: string;
  body: string;
  href: string;
  icon: ReactNode;
  tone: string;
};

function getDayPhase(hour: number): DayPhase {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getPhaseGreeting(phase: DayPhase) {
  if (phase === "morning") return "Good morning";
  if (phase === "afternoon") return "Good afternoon";
  return "Good evening";
}

function getPhaseLabel(phase: DayPhase) {
  if (phase === "morning") return "Morning setup";
  if (phase === "afternoon") return "Midday recalibration";
  return "Evening landing";
}

function getPhaseIcon(phase: DayPhase) {
  if (phase === "morning") return <SunMedium className="h-4 w-4" />;
  if (phase === "afternoon") return <Coffee className="h-4 w-4" />;
  return <Sunset className="h-4 w-4" />;
}

function getPhaseTone(phase: DayPhase) {
  if (phase === "morning") return "from-amber-500/10 via-card/80 to-sky-500/8";
  if (phase === "afternoon") return "from-violet-500/10 via-card/80 to-emerald-500/8";
  return "from-indigo-500/12 via-card/80 to-rose-500/8";
}

function getAdaptiveHeroCopy(phase: DayPhase, softestLabel?: string) {
  if (phase === "morning") {
    return softestLabel
      ? `Start gently: ${softestLabel} is your cleanest first lever.`
      : "Hydrate, scan recovery, then choose the first real task.";
  }

  if (phase === "afternoon") {
    return softestLabel
      ? `Protect the middle of the day: move ${softestLabel} one notch.`
      : "Re-center around food, movement, and one useful next action.";
  }

  return softestLabel
    ? `Land the day softly: close the loop on ${softestLabel}.`
    : "Reflect, recover, and leave tomorrow easier than today.";
}

function getMomentumCoachLine(phase: DayPhase, score: number, softestLabel?: string) {
  if (score >= 85) {
    return phase === "evening"
      ? "You have earned a clean shutdown. Preserve the win."
      : "Momentum is already high. Keep the next move small and precise.";
  }

  if (score >= 55) {
    return softestLabel
      ? `${softestLabel} is the quiet gap. One small action keeps the day coherent.`
      : "The day is stable. Pick one move instead of opening every loop.";
  }

  if (phase === "evening") {
    return "No need to rescue the whole day. Close one loop and recover.";
  }

  return "Lower momentum is useful signal, not failure. Choose the easiest visible win.";
}

function getPhaseCues(phase: DayPhase, has: (id: string) => boolean): AdaptiveCue[] {
  if (phase === "morning") {
    return [
      has("nutrition") && {
        label: "Hydrate",
        title: "Start with water",
        body: "Give the day a low-friction first win.",
        href: "/app/nutrition",
        icon: <Droplets className="h-4 w-4" />,
        tone: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      },
      has("sleep") && {
        label: "Recovery",
        title: "Read your sleep",
        body: "Set ambition to match your energy.",
        href: "/app/sleep",
        icon: <Moon className="h-4 w-4" />,
        tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      },
      has("goals") && {
        label: "First focus",
        title: "Pick one task",
        body: "Anchor the day before it fragments.",
        href: "/app/upcoming",
        icon: <Target className="h-4 w-4" />,
        tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      },
    ].filter(Boolean) as AdaptiveCue[];
  }

  if (phase === "afternoon") {
    return [
      has("todos") && {
        label: "Productivity",
        title: "Clear one open loop",
        body: "Reduce mental tabs before they multiply.",
        href: "/app/todos",
        icon: <CheckCircle2 className="h-4 w-4" />,
        tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      },
      has("nutrition") && {
        label: "Nutrition",
        title: "Check your fuel",
        body: "The afternoon dip is usually information.",
        href: "/app/nutrition",
        icon: <Apple className="h-4 w-4" />,
        tone: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      },
      has("fitness") && {
        label: "Movement",
        title: "Move the body",
        body: "A short reset protects the rest of the day.",
        href: "/app/fitness",
        icon: <Dumbbell className="h-4 w-4" />,
        tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      },
    ].filter(Boolean) as AdaptiveCue[];
  }

  return [
    has("wellbeing") && {
      label: "Reflect",
      title: "Name the day",
      body: "A short check-in turns noise into signal.",
      href: "/app/wellbeing",
      icon: <Heart className="h-4 w-4" />,
      tone: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    },
    has("sleep") && {
      label: "Recovery",
      title: "Protect tonight",
      body: "Recovery is tomorrow's hidden productivity.",
      href: "/app/sleep",
      icon: <Moon className="h-4 w-4" />,
      tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    has("schedule") && {
      label: "Tomorrow",
      title: "Pre-load the morning",
      body: "Leave one clear starting point.",
      href: "/app/schedule",
      icon: <ClipboardList className="h-4 w-4" />,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ].filter(Boolean) as AdaptiveCue[];
}

function CompactPanel({
  icon,
  label,
  value,
  detail,
  href,
  tone = "bg-muted/50 text-muted-foreground",
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  href: string;
  tone?: string;
  className?: string;
}) {
  return (
    <Link
      to={href}
      className={`ai-layer-soft group col-span-2 min-w-0 rounded-2xl p-3 transition-all duration-500 ease-out hover:-translate-y-1 hover:bg-background/45 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)] lg:rounded-[1.15rem] lg:p-2.5 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full lg:h-6 lg:w-6 ${tone}`}>
          {icon}
        </span>
        <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:text-[10px]">
          {label}
        </span>
      </div>
      <div className="mt-3 truncate text-lg font-bold leading-none lg:mt-2 lg:text-base">{value}</div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{detail}</div>
    </Link>
  );
}

function MomentumPulseRing({ score, loading }: { score: number; loading: boolean }) {
  const value = loading ? 18 : score;
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (value / 100) * circumference;
  const glow = getMomentumTone(value);

  return (
    <div
      className="ai-breathe relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full sm:h-24 sm:w-24 lg:h-20 lg:w-20 xl:h-24 xl:w-24"
      style={{ filter: `drop-shadow(0 16px 34px ${glow})` }}
    >
      <div className="absolute inset-2 rounded-full bg-background/70 shadow-inner backdrop-blur" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/14 via-cyan-300/10 to-violet-400/14 blur-md" />
      <svg className="relative h-20 w-20 -rotate-90 sm:h-24 sm:w-24 lg:h-20 lg:w-20 xl:h-24 xl:w-24" viewBox="0 0 96 96" aria-hidden="true">
        <defs>
          <linearGradient id="dashboard-momentum-ring" x1="12" y1="12" x2="84" y2="84">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="48%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle
          cx="48"
          cy="48"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-background/70"
        />
        <circle
          cx="48"
          cy="48"
          r="38"
          fill="none"
          stroke="url(#dashboard-momentum-ring)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="7"
          className="transition-all duration-1000 ease-out"
        />
        <circle
          cx="48"
          cy="10"
          r="2.8"
          fill="#ecfeff"
          className="origin-center animate-[ai-orbit_9s_linear_infinite]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums sm:text-2xl lg:text-xl xl:text-2xl">{loading ? "--" : score}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          rhythm
        </span>
      </div>
    </div>
  );
}

function MomentumHero({
  greeting,
  firstName,
  today,
  phase,
}: {
  greeting: string;
  firstName: string;
  today: string;
  phase: DayPhase;
}) {
  const { modulesProgress, overallScore, loading } = useLifeProgress();
  const strongest = modulesProgress
    .filter((item) => item.pct > 0)
    .sort((a, b) => b.pct - a.pct)[0];
  const softest = modulesProgress
    .filter((item) => item.pct < 100)
    .sort((a, b) => a.pct - b.pct)[0];
  const glowClass = loading
    ? "ai-glow-low"
    : overallScore >= 80
      ? "ai-glow-high"
      : overallScore >= 45
        ? "ai-glow-mid"
        : "ai-glow-low";
  const motionClass = getMomentumMotionClass(overallScore, loading);

  return (
    <section
      className={`ai-atmosphere ai-reactive-edge ai-motion-enter-slow overflow-hidden rounded-[2rem] bg-gradient-to-br ${getPhaseTone(
        phase,
      )} ${glowClass} ${motionClass} p-4 transition-all duration-700 ease-out sm:p-5 lg:p-4 xl:p-5`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4 lg:gap-3">
        <div className="ai-depth-mid min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="ai-layer-soft ai-float flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground">
              {getPhaseIcon(phase)}
            </span>
            <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
              {getPhaseLabel(phase)} · {today}
            </p>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl lg:text-xl xl:text-2xl">
            {greeting}
            {firstName ? ` ${firstName}` : ""}
          </h1>
          <p className="mt-2 max-w-[14.5rem] text-sm leading-5 text-muted-foreground sm:max-w-[18rem] lg:max-w-[15rem] lg:text-xs xl:max-w-[18rem] xl:text-sm">
            {loading
              ? "Reading today's signals..."
              : getAdaptiveHeroCopy(phase, softest?.label)}
          </p>
        </div>

        <div className="ai-depth-near">
          <MomentumPulseRing score={overallScore} loading={loading} />
        </div>
      </div>

      <div className="mt-5 space-y-2 lg:mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">{loading ? "Syncing" : getMomentumLabel(overallScore)}</span>
          {strongest && (
            <span className="min-w-0 truncate text-muted-foreground">
              Best: {strongest.label} {strongest.pct}%
            </span>
          )}
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-background/60 shadow-inner">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400 shadow-[0_0_24px_rgba(103,232,249,0.32)] transition-all duration-1000 ease-out"
            style={{ width: `${loading ? 18 : overallScore}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-40 animate-[ai-sheen_5s_ease-in-out_infinite]" />
        </div>
      </div>

      <div className="ai-depth-mid ai-layer-soft mt-3 rounded-2xl px-3 py-2 text-xs leading-5 text-muted-foreground transition-colors duration-700 lg:leading-4">
        {loading
          ? "The home screen will adapt once your latest state is ready."
          : getMomentumCoachLine(phase, overallScore, softest?.label)}
      </div>
    </section>
  );
}

function NowFocusCard({ hasSchedule }: { hasSchedule: boolean }) {
  if (hasSchedule) return <ScheduleFocusCard />;
  return <GoalFocusCard />;
}

function AdaptiveCueCard({ cue }: { cue: AdaptiveCue }) {
  return (
    <Link
      to={cue.href}
      className="ai-layer-soft ai-motion-enter group min-w-[min(13rem,76vw)] flex-1 snap-start rounded-3xl p-4 transition-all duration-500 ease-out hover:-translate-y-1 hover:bg-background/35 md:min-w-0 lg:rounded-[1.35rem] lg:p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`ai-float flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:h-8 lg:w-8 ${cue.tone}`}>
          {cue.icon}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {cue.label}
        </div>
        <div className="mt-1 text-base font-bold leading-tight lg:text-sm">{cue.title}</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground lg:leading-4">{cue.body}</p>
      </div>
    </Link>
  );
}

function AdaptiveCueRail({
  phase,
  has,
}: {
  phase: DayPhase;
  has: (id: string) => boolean;
}) {
  const cues = getPhaseCues(phase, has);
  if (cues.length === 0) return null;

  return (
    <section className="md:col-span-2 lg:col-span-7 xl:col-span-8">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight lg:text-xs lg:uppercase lg:tracking-[0.16em] lg:text-muted-foreground">
          {phase === "morning"
            ? "Morning operating system"
            : phase === "afternoon"
            ? "Midday priorities"
            : "Evening close-down"}
        </h2>
        <span className="text-xs text-muted-foreground">Adaptive</span>
      </div>
      <div className="flex w-full min-w-0 snap-x gap-2.5 overflow-x-auto pb-1 pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-[1.2fr_0.9fr_1fr] md:overflow-visible md:pr-0 md:[&>*:nth-child(2)]:translate-y-4 md:[&>*:nth-child(3)]:-translate-y-2 lg:gap-2 lg:md:[&>*:nth-child(2)]:translate-y-2 lg:md:[&>*:nth-child(3)]:-translate-y-1">
        {cues.map((cue) => (
          <AdaptiveCueCard key={cue.label} cue={cue} />
        ))}
      </div>
    </section>
  );
}

function ScheduleFocusCard() {
  const preferences = useUserPreferences();
  const { summary, nextBlock, loading, viewLabel } = useScheduleDashboard();
  const title = nextBlock ? `${nextBlock.icon} ${nextBlock.label}` : "Schedule clear";
  const detail = nextBlock
    ? `${formatTimeStringWithPreferences(nextBlock.time, preferences)} · ${viewLabel}`
    : `${summary.done}/${summary.total} blocks complete`;

  return (
    <Link to="/app/schedule" className="ai-priority-surface ai-reactive-edge block rounded-3xl p-4 text-foreground transition-transform duration-500 hover:-translate-y-1 lg:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Now</span>
        </div>
        <span className="rounded-full bg-foreground/6 px-2 py-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {loading ? "syncing" : `${summary.pct}%`}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 lg:mt-5">
        <div className="min-w-0">
          <div className="truncate text-xl font-bold lg:text-lg xl:text-xl">{title}</div>
          <div className="mt-1 truncate text-sm text-muted-foreground lg:text-xs xl:text-sm">{detail}</div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}

function GoalFocusCard() {
  const { previewItems, overdueCount, totalCount, loading } = useGoalsDashboard();
  const top = previewItems[0];

  return (
    <Link to="/app/upcoming" className="ai-priority-surface ai-reactive-edge block rounded-3xl p-4 text-foreground transition-transform duration-500 hover:-translate-y-1 lg:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Focus</span>
        </div>
        <span className="rounded-full bg-foreground/6 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
          {loading ? "syncing" : overdueCount > 0 ? `${overdueCount} overdue` : `${totalCount} due`}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 lg:mt-5">
        <div className="min-w-0">
          <div className="truncate text-xl font-bold lg:text-lg xl:text-xl">{top ? top.step.label : "No urgent goal steps"}</div>
          <div className="mt-1 truncate text-sm text-muted-foreground lg:text-xs xl:text-sm">
            {top ? `${top.goalEmoji} ${top.goalTitle}` : "Your goal list is quiet today."}
          </div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}

function GoalsSummary() {
  const { totalCount, overdueCount, loading } = useGoalsDashboard();
  return (
    <CompactPanel
      icon={<Target className="h-3.5 w-3.5" />}
      label="Goals"
      value={loading ? "..." : totalCount ? `${totalCount} due` : "Clear"}
      detail={overdueCount > 0 ? `${overdueCount} overdue` : "Upcoming steps"}
      href="/app/upcoming"
      tone="bg-rose-500/10 text-rose-600 dark:text-rose-400"
    />
  );
}

function NutritionSummary() {
  const { calPct, itemsLogged, proteinRemaining, loading } = useNutritionDashboard();
  return (
    <CompactPanel
      icon={<Apple className="h-3.5 w-3.5" />}
      label="Nutrition"
      value={loading ? "..." : `${calPct}%`}
      detail={itemsLogged > 0 ? `${itemsLogged} logged` : `${Math.max(0, proteinRemaining)}g protein left`}
      href="/app/nutrition"
      tone="bg-orange-500/10 text-orange-600 dark:text-orange-400"
    />
  );
}

function ReadingSummary() {
  const { stats, hasReading, loading } = useReadingDashboard();
  return (
    <CompactPanel
      icon={<BookOpen className="h-3.5 w-3.5" />}
      label="Reading"
      value={loading ? "..." : hasReading ? `${stats.pct}%` : "Set book"}
      detail={hasReading ? stats.current.title || "Current book" : "Start tracking"}
      href="/app/reading"
      tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    />
  );
}

function SleepSummary() {
  const { latest, loggedToday, loading } = useSleepDashboard();
  const hours =
    latest?.sleepDurationMinutes != null
      ? Math.round((latest.sleepDurationMinutes / 60) * 10) / 10
      : null;
  return (
    <CompactPanel
      icon={<Moon className="h-3.5 w-3.5" />}
      label="Sleep"
      value={loading ? "..." : loggedToday && hours != null ? `${hours}h` : "Log"}
      detail={loggedToday ? "Logged today" : "Recovery check"}
      href="/app/sleep"
      tone="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
    />
  );
}

function WellbeingSummary() {
  const { latest, checkedInToday, loading } = useWellbeingDashboard();
  return (
    <CompactPanel
      icon={<Heart className="h-3.5 w-3.5" />}
      label="Mood"
      value={loading ? "..." : checkedInToday ? `${latest?.moodScore ?? "-"}/5` : "Check in"}
      detail={checkedInToday ? "Today logged" : "60 seconds"}
      href="/app/wellbeing"
      tone="bg-pink-500/10 text-pink-600 dark:text-pink-400"
    />
  );
}

function FitnessSummary() {
  const { topLifts, loading } = useFitnessDashboard();
  const active = topLifts.find((lift) => lift.best !== null);
  return (
    <CompactPanel
      icon={<Dumbbell className="h-3.5 w-3.5" />}
      label="Fitness"
      value={loading ? "..." : active ? `${active.pct}%` : "Set PR"}
      detail={active ? active.label : "Strength goals"}
      href="/app/fitness"
      tone="bg-violet-500/10 text-violet-600 dark:text-violet-400"
    />
  );
}

function FinanceSummary() {
  const { totalSpent, isEmpty, loading } = useSpendingDashboard("finance");
  return (
    <CompactPanel
      icon={<Wallet className="h-3.5 w-3.5" />}
      label="Finance"
      value={loading ? "..." : isEmpty ? "Start" : formatDkk(totalSpent)}
      detail={isEmpty ? "First money signal" : "This month"}
      href="/app/finance"
      tone="bg-teal-500/10 text-teal-600 dark:text-teal-400"
    />
  );
}

function TodoSummary() {
  const { incomplete, doneCount, loading } = useTodoDashboard();
  return (
    <CompactPanel
      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
      label="To-do"
      value={loading ? "..." : incomplete.length > 0 ? `${incomplete.length} open` : "Clear"}
      detail={incomplete.length > 0 ? `${doneCount} done` : "Protect the calm"}
      href="/app/todos"
      tone="bg-sky-500/10 text-sky-600 dark:text-sky-400"
    />
  );
}

function SkincareSummary() {
  const { summary, loading } = useSkincareDashboard();
  return (
    <CompactPanel
      icon={<Sparkles className="h-3.5 w-3.5" />}
      label="Skin"
      value={loading ? "..." : summary.didCompleteToday ? "Done" : summary.totalSteps > 0 ? `${summary.completedToday}/${summary.totalSteps}` : "Start"}
      detail={summary.totalSteps > 0 ? `${summary.streakDays}d streak` : "Build routine"}
      href="/app/skincare"
      tone="bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
    />
  );
}

function AdaptiveSignalGrid({
  phase,
  has,
}: {
  phase: DayPhase;
  has: (id: string) => boolean;
}) {
  if (phase === "morning") {
    return (
      <>
        {has("sleep") && <SleepSummary />}
        {has("nutrition") && <NutritionSummary />}
        {has("goals") && <GoalsSummary />}
        {has("reading") && <ReadingSummary />}
        {has("wellbeing") && <WellbeingSummary />}
        {has("fitness") && <FitnessSummary />}
        {has("todos") && <TodoSummary />}
        {has("finance") && <FinanceSummary />}
        {has("skincare") && <SkincareSummary />}
      </>
    );
  }

  if (phase === "afternoon") {
    return (
      <>
        {has("todos") && <TodoSummary />}
        {has("nutrition") && <NutritionSummary />}
        {has("fitness") && <FitnessSummary />}
        {has("goals") && <GoalsSummary />}
        {has("reading") && <ReadingSummary />}
        {has("wellbeing") && <WellbeingSummary />}
        {has("sleep") && <SleepSummary />}
        {has("finance") && <FinanceSummary />}
        {has("skincare") && <SkincareSummary />}
      </>
    );
  }

  return (
    <>
      {has("wellbeing") && <WellbeingSummary />}
      {has("sleep") && <SleepSummary />}
      {has("goals") && <GoalsSummary />}
      {has("nutrition") && <NutritionSummary />}
      {has("reading") && <ReadingSummary />}
      {has("fitness") && <FitnessSummary />}
      {has("todos") && <TodoSummary />}
      {has("finance") && <FinanceSummary />}
      {has("skincare") && <SkincareSummary />}
    </>
  );
}

export default function DashboardPage() {
  const profileQuery = useProfileQuery();
  const profile = profileQuery.data;
  const firstName = profile?.display_name?.trim().split(/\s+/)[0] ?? "";
  const preferences = useUserPreferences();

  const hour = new Date().getHours();
  const phase = getDayPhase(hour);
  const greeting = getPhaseGreeting(phase);
  const today = formatDateWithPreferences(new Date(), preferences, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const { modules, loading: modulesLoading } = useEnabledModules();
  const tier = useTier();
  const isPro = tierMeets(tier, "pro");
  const has = useCallback((id: string) => modules.has(id as never), [modules]);
  const hasPrimaryFocus = has("schedule") || has("goals");

  const { goals, isGoalsLoading: goalsLoading } = useGoalsState();
  const goalCount = goals.length;
  const dashboardTrackedRef = useRef(false);
  const [showDetailedModules, setShowDetailedModules] = useState(false);

  const showPrimaryCoach = useDeferredMount(140);
  const showSecondaryEnhancements = useDeferredMount(380);

  const showEmptyState = !profileQuery.isLoading && !modulesLoading && !goalsLoading && goalCount === 0;

  useEffect(() => {
    if (dashboardTrackedRef.current) return;
    if (profileQuery.isLoading || modulesLoading || goalsLoading) return;

    dashboardTrackedRef.current = true;
    capture("dashboard_viewed", {
      route: "/app",
      tier,
      goals_count: goalCount,
      enabled_modules_count: modules.size,
      is_empty_state: goalCount === 0,
    });
  }, [goalCount, goalsLoading, modules.size, modulesLoading, profileQuery.isLoading, tier]);

  return (
    <div className="mx-auto max-w-[118rem] space-y-5 md:space-y-7 lg:space-y-5">
      <section className="ai-depth-stage ai-motion-enter ai-layer relative min-w-0 overflow-hidden rounded-[2.35rem] p-2 transition-shadow duration-700 ease-out md:p-3 lg:p-4 xl:p-5">
        <div className="ai-depth-mid grid min-w-0 gap-3 px-1 pb-1 md:grid-cols-5 md:items-start md:px-2 lg:grid-cols-12 lg:gap-3 lg:px-0 lg:pb-0">
          <div
            className={`relative z-20 ${
              hasPrimaryFocus ? "md:col-span-3 lg:col-span-7 xl:col-span-8" : "md:col-span-5 lg:col-span-12"
            }`}
          >
            <Suspense fallback={<AICoachCardSkeleton />}>
              {showPrimaryCoach ? <AICoachCard /> : <AICoachCardSkeleton />}
            </Suspense>

            <div className="ai-depth-far mt-3 hidden lg:block">
              <AdaptiveCueRail phase={phase} has={has} />
            </div>
          </div>

          {hasPrimaryFocus && (
            <div className="ai-depth-near relative z-10 space-y-3 md:col-span-2 md:translate-y-6 lg:col-span-5 lg:translate-y-0 xl:col-span-4">
              <NowFocusCard hasSchedule={has("schedule")} />
              <div className="hidden lg:block">
                <MomentumHero
                  greeting={greeting}
                  firstName={firstName}
                  today={today}
                  phase={phase}
                />
              </div>
            </div>
          )}
        </div>

        {!hasPrimaryFocus && (
          <div className="mt-3 hidden lg:block">
            <MomentumHero
              greeting={greeting}
              firstName={firstName}
              today={today}
              phase={phase}
            />
          </div>
        )}

        <div className="mt-3 grid min-w-0 gap-3 px-1 md:mt-5 md:px-2 lg:hidden">
          <div className="ai-depth-near min-w-0">
            <MomentumHero
              greeting={greeting}
              firstName={firstName}
              today={today}
              phase={phase}
            />
          </div>

          <div className="ai-depth-far min-w-0">
            <AdaptiveCueRail phase={phase} has={has} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-3">
        {showEmptyState && <DashboardStartHereCard />}

        <div className="md:col-span-2 lg:col-span-12">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-muted-foreground lg:text-[11px] lg:uppercase lg:tracking-[0.18em]">
              System signals
            </h2>
            <span className="text-xs text-muted-foreground/70">available when needed</span>
          </div>
          <div className="grid auto-rows-[minmax(5.25rem,auto)] grid-cols-4 gap-2.5 opacity-82 transition-all duration-700 ease-out hover:opacity-100 sm:grid-cols-6 lg:auto-rows-[minmax(4.6rem,auto)] lg:grid-cols-12 lg:gap-2 [&>*:nth-child(1)]:row-span-2 [&>*:nth-child(1)]:rounded-[1.6rem] [&>*:nth-child(2)]:translate-y-3 [&>*:nth-child(4)]:-translate-y-2 lg:[&>*:nth-child(1)]:col-span-3 lg:[&>*:nth-child(2)]:col-span-2 lg:[&>*:nth-child(2)]:translate-y-0 lg:[&>*:nth-child(3)]:col-span-3 lg:[&>*:nth-child(4)]:-translate-y-0">
            <AdaptiveSignalGrid phase={phase} has={has} />
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-12">
          <Button
            type="button"
            variant="outline"
            className="ai-layer-soft h-10 w-full justify-between rounded-full border-0 bg-transparent px-4 text-muted-foreground shadow-none hover:bg-background/35"
            onClick={() => setShowDetailedModules((value) => !value)}
          >
            {showDetailedModules ? "Hide detailed modules" : "Open detailed modules"}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showDetailedModules ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {showDetailedModules && (
        <div className="space-y-4 pt-1 lg:space-y-3">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-3">
            <Suspense fallback={<LifeProgressCardSkeleton />}>
              {showSecondaryEnhancements ? <LifeProgressCard /> : <LifeProgressCardSkeleton />}
            </Suspense>
          </div>

          {(has("schedule") || has("goals")) && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-3">
            {has("schedule") && (
              <Suspense fallback={<ScheduleCardSkeleton />}>
                {showSecondaryEnhancements ? <ScheduleCard /> : <ScheduleCardSkeleton />}
              </Suspense>
            )}

            {has("goals") && (
              <Suspense fallback={<UpcomingGoalsCardSkeleton />}>
                {showSecondaryEnhancements ? (
                  <UpcomingGoalsCard />
                ) : (
                  <UpcomingGoalsCardSkeleton />
                )}
              </Suspense>
            )}
          </div>
        )}

        {(has("nutrition") || has("reading")) && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-3">
            {has("nutrition") && (
              <Suspense fallback={<MacrosCardSkeleton />}>
                {showSecondaryEnhancements ? <MacrosCard /> : <MacrosCardSkeleton />}
              </Suspense>
            )}

            {has("reading") && (
              <Suspense fallback={<ReadingCardSkeleton />}>
                {showSecondaryEnhancements ? <ReadingCard /> : <ReadingCardSkeleton />}
              </Suspense>
            )}
          </div>
        )}

        {(has("sleep") || has("wellbeing")) && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-3">
            {has("sleep") && (
              <Suspense fallback={<SleepCardSkeleton />}>
                {showSecondaryEnhancements ? <SleepCard /> : <SleepCardSkeleton />}
              </Suspense>
            )}

            {has("wellbeing") && (
              <Suspense fallback={<WellbeingCardSkeleton />}>
                {showSecondaryEnhancements ? (
                  <WellbeingCard />
                ) : (
                  <WellbeingCardSkeleton />
                )}
              </Suspense>
            )}
          </div>
        )}

        {(isPro || has("finance")) && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-3">
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-3">
          {has("fitness") && (
            <Suspense fallback={<FitnessCardSkeleton />}>
              {showSecondaryEnhancements ? <FitnessCard /> : <FitnessCardSkeleton />}
            </Suspense>
          )}

          {has("skincare") && (
            <Suspense fallback={<FitnessCardSkeleton />}>
              {showSecondaryEnhancements ? <SkincareCard /> : <FitnessCardSkeleton />}
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
      )}

      {!modulesLoading && modules.size === 0 && (
        <div className="ai-layer-soft space-y-3 rounded-2xl p-5 text-center">
          <p className="text-lg font-semibold">Choose your first signals</p>
          <p className="text-sm text-muted-foreground">
            Turn on only the modules you want your AI coach to pay attention to.
          </p>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to="/app/profile">Open settings</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
