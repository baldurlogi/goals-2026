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
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${accentClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ModuleTile({ item }: { item: ModuleProgress }) {
  return (
    <Link
      to={item.href}
      className="group flex flex-col gap-2.5 rounded-xl border bg-card/60 p-3.5 transition-all hover:bg-card hover:shadow-sm hover:ring-1 hover:ring-border"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`text-${item.color}-500 shrink-0`}>{item.icon}</span>
          <span className="truncate text-xs font-semibold">{item.label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {item.streak != null && item.streak > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
              🔥 {item.streak}
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
    <div className="animate-pulse rounded-xl border bg-card/40 p-3.5">
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
    score >= 80 ? "Crushing it" :
    score >= 60 ? "Good momentum" :
    score >= 40 ? "Building up" :
    score >= 20 ? "Getting started" :
    "Let's go";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-14 w-14">
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" strokeWidth="3" className="stroke-muted" />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="stroke-violet-500 transition-all duration-700"
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

    return <circle cx={cx} cy={cy} r={2.5} fill="#8b5cf6" />;
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

    return <circle cx={cx} cy={cy} r={4} fill="#8b5cf6" />;
  };
  const renderXAxisLabel = (_value: string, index: number) => chartData[index]?.label ?? "";

  return (
    <div className="rounded-2xl border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            7-day trend
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

      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        <span>Progress (%)</span>
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
              stroke="#8b5cf6"
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
    <Card className="overflow-hidden lg:col-span-12">
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15">
              <Target className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Today&apos;s progress
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
