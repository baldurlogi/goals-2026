import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  getMonthKey,
  loadFinanceMonth,
  saveFinanceMonth,
  defaultFinanceState,
  FINANCE_CHANGED_EVENT,
  type FinanceCategoryId,
  type FinanceMonthState,
} from "../financeStorage";
import { PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";

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
  food_drinks:   "#F59E0B",
  entertainment: "#6366F1",
  other:         "#94A3B8",
};

function readCache(goalId: string, month: string): FinanceMonthState {
  try {
    const raw = localStorage.getItem(`cache:finance:${goalId}:${month}`);
    return raw ? JSON.parse(raw) : defaultFinanceState(month);
  } catch { return defaultFinanceState(month); }
}

export function SpendingDonutCard(props: {
  goalId: string;
  month?: string;
  className?: string;
}) {
  const { goalId, month: controlledMonth, className } = props;
  const [month, setMonth] = useState(() => controlledMonth ?? getMonthKey());

  useEffect(() => {
    if (controlledMonth) setMonth(controlledMonth);
  }, [controlledMonth]);

  // Seed from cache for instant paint, then fetch from Supabase
  const [data, setData] = useState<FinanceMonthState>(() => readCache(goalId, month));

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      const fresh = await loadFinanceMonth(goalId, month);
      if (!cancelled) setData(fresh);
    }
    fetch();

    const sync = () => fetch();
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

  const isEmpty = totalSpent <= 0;

  // Update a category field and save
  async function updateCategory(id: FinanceCategoryId, field: "budget" | "spent", raw: string) {
    const value = Number(raw) || 0;
    const next: FinanceMonthState = {
      ...data,
      categories: data.categories.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    };
    setData(next);
    await saveFinanceMonth(goalId, next);
  }

  async function updateIncome(raw: string) {
    const next = { ...data, income: Number(raw) || 0 };
    setData(next);
    await saveFinanceMonth(goalId, next);
  }

  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Spending breakdown</div>
          <div className="text-lg font-semibold">Where your money goes</div>
          <div className="text-sm text-muted-foreground">{monthLabel(month)}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* LEFT: Donut */}
        <div className="rounded-2xl border bg-card/30 p-6">
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
                      shape={(props: any) => {
                        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, index } = props;
                        const entry = donutData[index];
                        if (!entry) return <g />;
                        const RADIAN = Math.PI / 180;
                        const sin0 = Math.sin(-RADIAN * startAngle);
                        const cos0 = Math.cos(-RADIAN * startAngle);
                        const sin1 = Math.sin(-RADIAN * endAngle);
                        const cos1 = Math.cos(-RADIAN * endAngle);
                        const mx0 = cx + outerRadius * cos0, my0 = cy + outerRadius * sin0;
                        const mx1 = cx + outerRadius * cos1, my1 = cy + outerRadius * sin1;
                        const ix0 = cx + innerRadius * cos0, iy0 = cy + innerRadius * sin0;
                        const ix1 = cx + innerRadius * cos1, iy1 = cy + innerRadius * sin1;
                        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                        const d = [
                          `M ${mx0} ${my0}`,
                          `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${mx1} ${my1}`,
                          `L ${ix1} ${iy1}`,
                          `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix0} ${iy0}`,
                          "Z",
                        ].join(" ");
                        return <path d={d} fill={entry.color} stroke="transparent" />;
                      }}
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

        {/* RIGHT: Editable category table */}
        <div className="rounded-2xl border bg-card/30 p-6 space-y-4">
          {/* Income */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Monthly income</span>
            <input
              type="number" min="0" value={data.income || ""}
              onChange={(e) => updateIncome(e.target.value)}
              placeholder="0"
              className="w-28 rounded-lg border bg-background px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="h-px bg-border" />

          <div className="text-sm font-medium">Categories</div>

          <div className="max-h-80 overflow-auto pr-1 space-y-2">
            {data.categories.map((c) => (
              <div key={c.id} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLOR[c.id] }} />
                  <span className="text-sm font-medium flex-1">{c.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">Budget</div>
                    <input
                      type="number" min="0" value={c.budget || ""}
                      onChange={(e) => updateCategory(c.id, "budget", e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border bg-background px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">Spent</div>
                    <input
                      type="number" min="0" value={c.spent || ""}
                      onChange={(e) => updateCategory(c.id, "spent", e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border bg-background px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground">
            Tip: rent can dominate the chart — that's normal. Watch for "Food & Drinks" or "Entertainment" creeping up over time.
          </p>
        </div>
      </div>
    </div>
  );
}