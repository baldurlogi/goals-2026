import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLifeProgress } from "@/features/dashboard/useLifeProgress";
import {
  type LifeProgressChartPoint,
  buildLifeProgressChartSeries,
  useLifeProgressHistory,
} from "@/features/dashboard/lifeProgressHistory";

type RangeOption = 7 | 30 | 90;

function RangeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
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
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-semibold">
        {point.payload.score == null ? "No data" : `${point.payload.score}%`}
      </div>
      <div className="text-muted-foreground">{point.payload.date}</div>
    </div>
  );
}

export default function LifeProgressPage() {
  const [range, setRange] = useState<RangeOption>(30);
  const { modulesProgress, overallScore, loading } = useLifeProgress();
  const history = useLifeProgressHistory(range);
  const chartData = buildLifeProgressChartSeries(history);
  const singleDayView = history.filter((item) => item.score != null).length === 1;
  const renderDot = ({ cx, cy, payload }: { cx?: number; cy?: number; payload?: LifeProgressChartPoint }) => {
    if (payload?.synthetic || cx == null || cy == null) return null;

    return <circle cx={cx} cy={cy} r={3} fill="#8b5cf6" />;
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

    return <circle cx={cx} cy={cy} r={5} fill="#8b5cf6" />;
  };
  const renderXAxisLabel = (_value: string, index: number) => chartData[index]?.label ?? "";

  const stats = useMemo(() => {
    const scoredHistory = history.filter(
      (item): item is typeof item & { score: number } => item.score != null,
    );

    if (scoredHistory.length === 0) {
      return { average: 0, best: 0, bestLabel: "—", lowest: 0, lowestLabel: "—" };
    }

    const average = Math.round(
      scoredHistory.reduce((sum, item) => sum + item.score, 0) / scoredHistory.length,
    );
    const best = scoredHistory.reduce((current, item) =>
      item.score >= current.score ? item : current,
    );
    const lowest = scoredHistory.reduce((current, item) =>
      item.score <= current.score ? item : current,
    );

    return {
      average,
      best: best.score,
      bestLabel: best.date,
      lowest: lowest.score,
      lowestLabel: lowest.date,
    };
  }, [history]);

  const hasHistoryData = history.some((item) => item.score != null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link
              to="/app"
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-semibold">Progress trends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            See how your overall daily progress changes across the week, month, and beyond.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
          <RangeButton active={range === 7} label="7d" onClick={() => setRange(7)} />
          <RangeButton active={range === 30} label="30d" onClick={() => setRange(30)} />
          <RangeButton active={range === 90} label="90d" onClick={() => setRange(90)} />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
                <TrendingUp className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Overall life progress</p>
                <p className="text-[11px] text-muted-foreground">
                  Last {range} days
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-right">
              <div className="text-2xl font-bold tabular-nums text-violet-400">{overallScore}%</div>
              <div className="text-xs text-muted-foreground">Current daily score</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card/50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Average
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{stats.average}%</div>
            </div>
            <div className="rounded-xl border bg-card/50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Best day
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{stats.best}%</div>
              <div className="text-xs text-muted-foreground">{stats.bestLabel}</div>
            </div>
            <div className="rounded-xl border bg-card/50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Lowest day
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{stats.lowest}%</div>
              <div className="text-xs text-muted-foreground">{stats.lowestLabel}</div>
            </div>
          </div>

          <div className="h-[380px] w-full rounded-2xl border bg-muted/10 p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Progress (%)
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 16, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="life-progress-page-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="#8b5cf6"
                      stopOpacity={singleDayView ? 0.36 : 0.24}
                    />
                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity={singleDayView ? 0.14 : 0.07}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  className="text-border/70"
                />
                <XAxis
                  dataKey="axisKey"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={18}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickFormatter={renderXAxisLabel}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickFormatter={(value: number) => `${value}%`}
                />
                <Tooltip content={<TrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="none"
                  fill="url(#life-progress-page-fill)"
                  baseValue={0}
                  connectNulls={false}
                />
                {hasHistoryData && (
                  <ReferenceLine
                    y={stats.average}
                    stroke="#a78bfa"
                    strokeDasharray="4 4"
                    ifOverflow="extendDomain"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  connectNulls={false}
                  dot={renderDot}
                  activeDot={renderActiveDot}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 pt-5">
          <div>
            <p className="text-sm font-semibold">Today&apos;s module mix</p>
            <p className="text-xs text-muted-foreground">
              Your overall score is the average of these active module scores.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pb-5">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading current progress…</div>
          ) : modulesProgress.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No modules contributing to life progress yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modulesProgress.map((module) => (
                <div key={module.id} className="rounded-xl border bg-card/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`text-${module.color}-500 shrink-0`}>{module.icon}</span>
                      <span className="truncate text-sm font-semibold">{module.label}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{module.pct}%</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{module.primaryStat}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
