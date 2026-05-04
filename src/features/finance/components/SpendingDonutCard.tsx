import { useEffect, useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  buildMonthRange,
  getMonthKey,
  loadFinanceHistory,
  loadFinanceMonth,
  normalizeFinanceMonthState,
  defaultFinanceState,
  FINANCE_CHANGED_EVENT,
  type FinanceCategoryId,
  type FinanceMonthState,
} from "../financeStorage";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { makeShapeFn } from "@/app/pieShape";

function formatDkk(n: number) {
  return new Intl.NumberFormat("da-DK").format(Math.round(n));
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });
}

const CATEGORY_COLOR: Record<FinanceCategoryId, string> = {
  rent:          "#10B981",
  subscriptions: "#8B5CF6",
  transport:     "#38BDF8",
  groceries:     "#84CC16",
  gym_health:    "#F472B6",
  personal_care: "#FB7185",
  shopping:      "#60A5FA",
  food_drinks:   "#F59E0B",
  entertainment: "#6366F1",
  other:         "#94A3B8",
};

function readCache(goalId: string, month: string): FinanceMonthState {
  try {
    const raw = localStorage.getItem(`cache:finance:${goalId}:${month}`);
    return raw
      ? normalizeFinanceMonthState(JSON.parse(raw), month)
      : defaultFinanceState(month);
  } catch { return defaultFinanceState(month); }
}

export function SpendingDonutCard(props: {
  goalId: string;
  month?: string;
  className?: string;
}) {
  const HISTORY_MONTHS = 6;
  const { goalId, month: controlledMonth, className } = props;
  const [uncontrolledMonth] = useState(() => getMonthKey());
  const month = controlledMonth ?? uncontrolledMonth;
  const [chartMode, setChartMode] = useState<"flow" | "net">("flow");

  // Seed from cache for instant paint, then fetch from Supabase
  const [data, setData] = useState<FinanceMonthState>(() => readCache(goalId, month));
  const [history, setHistory] = useState<FinanceMonthState[]>(() =>
    buildMonthRange(month, HISTORY_MONTHS).map((entryMonth) => readCache(goalId, entryMonth)),
  );

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      const fresh = await loadFinanceMonth(goalId, month);
      if (!cancelled) setData(fresh);
    }
    async function fetchHistory() {
      const freshHistory = await loadFinanceHistory(goalId, month, HISTORY_MONTHS);
      if (!cancelled) setHistory(freshHistory);
    }
    fetch();
    fetchHistory();

    const sync = () => {
      fetch();
      fetchHistory();
    };
    window.addEventListener(FINANCE_CHANGED_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(FINANCE_CHANGED_EVENT, sync);
    };
  }, [goalId, month]);

  const donutData = useMemo(() =>
    data.categories
      .map((c) => ({
        id: c.id, name: c.name,
        value: Math.max(0, Number(c.spent) || 0),
        color: CATEGORY_COLOR[c.id],
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value),
    [data],
  );

  const totalSpent = useMemo(
    () => donutData.reduce((acc, d) => acc + d.value, 0),
    [donutData],
  );

  const historyChartData = useMemo(
    () =>
      history.map((entry) => {
        const outgoing = entry.categories.reduce((sum, category) => sum + (category.spent || 0), 0);
        const incoming = entry.income || 0;
        const net = incoming - outgoing;
        const [year, monthNumber] = entry.month.split("-").map(Number);
        const date = new Date(year, (monthNumber ?? 1) - 1, 1);

        return {
          month: entry.month,
          label: date.toLocaleDateString("en-US", { month: "short" }),
          fullLabel: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          incoming,
          outgoing,
          net,
        };
      }),
    [history],
  );

  const spentCategories = useMemo(
    () =>
      data.categories
        .filter((c) => (Number(c.spent) || 0) > 0)
        .sort((a, b) => (b.spent || 0) - (a.spent || 0)),
    [data.categories],
  );

  const isEmpty = totalSpent <= 0;
  const activeBarStyle = {
    fillOpacity: 0.92,
    stroke: "rgba(255,255,255,0.35)",
    strokeWidth: 1,
  } as const;

  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Spending breakdown</div>
          <div className="text-lg font-semibold">Where your money goes</div>
          <div className="text-sm text-muted-foreground">{monthLabel(month)}</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card/30 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">Month-by-month insights</div>
            <div className="text-xs text-muted-foreground">
              Compare your last {HISTORY_MONTHS} months and flip to net when you want to see savings room.
            </div>
          </div>

          <ToggleGroup
            type="single"
            value={chartMode}
            onValueChange={(value) => {
              if (value === "flow" || value === "net") {
                setChartMode(value);
              }
            }}
            variant="outline"
            size="sm"
            className="w-full sm:w-fit"
          >
            <ToggleGroupItem value="flow" className="flex-1 px-3 sm:flex-none">
              Incoming / Outgoing
            </ToggleGroupItem>
            <ToggleGroupItem value="net" className="flex-1 px-3 sm:flex-none">
              Net gain / loss
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyChartData} barCategoryGap={18} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                width={38}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    incoming: "Incoming",
                    outgoing: "Outgoing",
                    net: "Net",
                  };

                  const seriesName = String(name ?? "");
                  return [`${formatDkk(Number(value ?? 0))} DKK`, labels[seriesName] ?? seriesName];
                }}
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload?.fullLabel ?? ""
                }
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.25)",
                  background: "rgba(15,23,42,0.92)",
                  color: "white",
                }}
                itemStyle={{ color: "white" }}
                labelStyle={{ color: "white" }}
              />
              {chartMode === "net" ? <ReferenceLine y={0} stroke="rgba(148,163,184,0.35)" /> : null}

              {chartMode === "flow" ? (
                <>
                  <Bar
                    dataKey="incoming"
                    name="incoming"
                    fill="#10B981"
                    radius={[8, 8, 0, 0]}
                    activeBar={activeBarStyle}
                  />
                  <Bar
                    dataKey="outgoing"
                    name="outgoing"
                    fill="#8B5CF6"
                    radius={[8, 8, 0, 0]}
                    activeBar={activeBarStyle}
                  />
                </>
              ) : (
                <Bar
                  dataKey="net"
                  name="net"
                  radius={[8, 8, 0, 0]}
                  activeBar={activeBarStyle}
                >
                  {historyChartData.map((entry) => (
                    <Cell key={entry.month} fill={entry.net >= 0 ? "#10B981" : "#ef4444"} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* LEFT: Donut */}
        <div className="rounded-xl border bg-card/30 p-6">
          <div className="relative h-80 w-full">
            {isEmpty ? (
              <div className="h-full rounded-xl border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                Add some "spent" amounts to see the chart.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData} dataKey="value" nameKey="name"
                      innerRadius="68%" outerRadius="95%" paddingAngle={2} stroke="transparent"
                      shape={makeShapeFn(donutData)}
                    />
                    <Tooltip
                      formatter={(value, name) => [`${formatDkk(Number(value))} DKK`, String(name)]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.25)",
                        background: "rgba(15,23,42,0.92)",
                        color: "white",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xs text-muted-foreground">Total spent</div>
                  <div className="text-3xl font-semibold">{formatDkk(totalSpent)} DKK</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Read-only spending summary */}
        <div className="rounded-xl border bg-card/30 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Monthly income</span>
            <span className="text-sm font-semibold tabular-nums">{formatDkk(data.income || 0)} DKK</span>
          </div>

          <div className="h-px bg-border" />

          <div className="text-sm font-medium">Categories</div>

          <div className="max-h-80 overflow-auto pr-1 space-y-2">
            {spentCategories.length > 0 ? spentCategories.map((c) => (
              <div key={c.id} className="rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLOR[c.id] }}
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium">{c.name}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatDkk(c.spent || 0)} DKK
                  </span>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Add spending in the tracker above to see the category breakdown here.
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground">
            Tip: rent can dominate the chart — that's normal. Watch for "Food & Drinks" or "Entertainment" creeping up over time.
          </p>
        </div>
      </div>
    </div>
  );
}
