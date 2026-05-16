import { Link } from "react-router-dom";
import { ArrowRight, Target } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { formatDateWithPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";
import { useLifeProgress, type ModuleProgress } from "@/features/dashboard/useLifeProgress";
import {
  type LifeProgressChartPoint,
  buildLifeProgressChartSeries,
  useLifeProgressHistory,
} from "@/features/dashboard/lifeProgressHistory";

function ProgressBar({ pct, accentClass }: { pct: number; accentClass: string }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/70 shadow-inner">
      <div
        className={`h-full rounded-full shadow-[0_0_16px_rgba(139,92,246,0.18)] transition-all duration-700 ease-out ${accentClass}`}
        style={{ width: `${pct}%` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-35 animate-[ai-sheen_6s_ease-in-out_infinite]" />
    </div>
  );
}

function ModuleTile({ item }: { item: ModuleProgress }) {
  return (
    <Link
      to={item.href}
      className="ai-layer-soft group flex flex-col gap-2.5 rounded-xl p-3.5 transition-all duration-500 hover:-translate-y-0.5 hover:bg-background/35 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`text-${item.color}-500 shrink-0`}>{item.icon}</span>
          <span className="truncate text-xs font-semibold">{item.label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {item.streak != null && item.streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.14)] dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
              {item.streak}d
            </span>
          )}
          <span className={`text-${item.color}-500 text-xs font-bold tabular-nums`}>
            {item.pct}%
          </span>
        </div>
      </div>

      <ProgressBar pct={item.pct} accentClass={item.accentClass} />

      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium leading-tight text-foreground">
          {item.primaryStat}
        </span>
        {item.secondaryStat && (
          <span className="truncate text-[10px] leading-tight text-muted-foreground">
            {item.secondaryStat}
          </span>
        )}
      </div>
    </Link>
  );
}

function SkeletonTile() {
  return (
    <div className="ai-layer-soft animate-pulse rounded-xl p-3.5">
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-3 w-8 rounded bg-muted" />
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-muted" />
      <div className="mt-2 h-3 w-24 rounded bg-muted" />
    </div>
  );
}

function OverallRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;
  const label =
    score >= 80 ? "Strong current" :
    score >= 60 ? "Steady rhythm" :
    score >= 40 ? "Taking shape" :
    score >= 20 ? "Small signal" :
    "Quiet start";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-14 w-14 drop-shadow-[0_12px_22px_rgba(103,232,249,0.22)]">
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-emerald-400/12 via-cyan-300/10 to-violet-400/12 blur-sm" />
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="life-progress-ring" x1="4" y1="4" x2="36" y2="36">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="52%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="none" strokeWidth="3" className="stroke-muted/70" />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="url(#life-progress-ring)"
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
          {score}%
        </span>
      </div>
      <span className="max-w-[64px] text-center text-[10px] font-medium leading-tight text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number | null; payload: { date: string; label: string; score: number | null } }>;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0];

  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="font-semibold">
        {point.payload.score == null ? "No data" : `${point.payload.score}%`}
      </div>
      <div className="text-muted-foreground">{point.payload.date}</div>
    </div>
  );
}

function TrendSparkline({
  score,
}: {
  score: number;
}) {
  const history = useLifeProgressHistory(7);
  const chartData = buildLifeProgressChartSeries(history);
  const scoredHistory = history.filter(
    (item): item is typeof item & { score: number } => item.score != null,
  );
  const singleDayView = scoredHistory.length === 1;
  const average = scoredHistory.length
    ? Math.round(scoredHistory.reduce((sum, item) => sum + item.score, 0) / scoredHistory.length)
    : 0;
  const renderDot = ({ cx, cy, payload }: { cx?: number; cy?: number; payload?: LifeProgressChartPoint }) => {
    if (payload?.synthetic || cx == null || cy == null) return null;

    return <circle cx={cx} cy={cy} r={2.5} fill="#67e8f9" />;
  };
  const renderActiveDot = ({
    cx,
    cy,
    payload,
  }: {
    cx?: number;
    cy?: number;
    payload?: LifeProgressChartPoint;
  }) => {
    if (payload?.synthetic || cx == null || cy == null) return null;

    return <circle cx={cx} cy={cy} r={4} fill="#34d399" />;
  };
  const renderXAxisLabel = (_value: string, index: number) => chartData[index]?.label ?? "";

  return (
    <div className="ai-surface rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Consistency arc
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            Today {score}% · Avg {average}%
          </p>
        </div>
        <Link
          to="/app/progress"
          className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Full graph <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 18, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="life-progress-dashboard-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#8b5cf6"
                  stopOpacity={singleDayView ? 0.34 : 0.22}
                />
                <stop
                  offset="100%"
                  stopColor="#8b5cf6"
                  stopOpacity={singleDayView ? 0.14 : 0.06}
                />
              </linearGradient>
              <linearGradient id="life-progress-dashboard-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="48%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="currentColor"
              strokeDasharray="3 3"
              className="text-border/70"
            />
            <XAxis
              dataKey="axisKey"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "currentColor" }}
              className="text-muted-foreground"
              tickFormatter={renderXAxisLabel}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              interval={0}
              tickLine={false}
              axisLine={false}
              width={36}
              tick={{ fontSize: 10, fill: "currentColor" }}
              className="text-muted-foreground"
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip content={<TrendTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="none"
              fill="url(#life-progress-dashboard-fill)"
              baseValue={0}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#life-progress-dashboard-line)"
              strokeWidth={2.5}
              connectNulls={false}
              dot={renderDot}
              activeDot={renderActiveDot}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LifeProgressCardInner() {
  const preferences = useUserPreferences();
  const { modulesProgress, overallScore, loading, skeletonCount } = useLifeProgress();

  return (
    <Card className="ai-layer overflow-hidden border-0 bg-transparent shadow-none lg:col-span-12">
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15">
              <Target className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Momentum field
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground/50">
            {formatDateWithPreferences(new Date(), preferences, {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        <div className="flex items-start gap-5">
          {modulesProgress.length > 0 && (
            <div className="hidden shrink-0 sm:flex">
              <OverallRing score={overallScore} />
            </div>
          )}

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {loading
              ? Array.from({ length: skeletonCount }).map((_, index) => (
                  <SkeletonTile key={index} />
                ))
              : modulesProgress.map((item) => <ModuleTile key={item.id} item={item} />)}
          </div>
        </div>

        {!loading && modulesProgress.length > 0 && <TrendSparkline score={overallScore} />}
      </CardContent>
    </Card>
  );
}

export function LifeProgressCard() {
  return (
    <ErrorBoundary
      variant="card"
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onRetry={reset}
          label="Life Progress"
          colSpan="lg:col-span-12"
        />
      )}
    >
      <LifeProgressCardInner />
    </ErrorBoundary>
  );
}
