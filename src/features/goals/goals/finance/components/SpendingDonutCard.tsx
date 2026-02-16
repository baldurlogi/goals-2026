import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import {
  getMonthKey,
  loadFinanceMonth,
  type FinanceCategoryId,
} from "../financeStorage";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function formatDkk(n: number) {
  return new Intl.NumberFormat("da-DK").format(Math.round(n));
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, 1);
  return dt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Keep colors stable per category so your brain learns them.
const CATEGORY_COLOR: Record<FinanceCategoryId, string> = {
  rent: "#10B981",          // emerald-500
  subscriptions: "#8B5CF6", // violet-500
  transport: "#38BDF8",     // sky-400
  groceries: "#84CC16",     // lime-500
  gym_health: "#F472B6",    // pink-400
  food_drinks: "#F59E0B",   // amber-500
  entertainment: "#6366F1", // indigo-500
  other: "#94A3B8",         // slate-400
};

type DonutDatum = {
  id: FinanceCategoryId;
  name: string;
  value: number; // spent
  color: string;
};

export function SpendingDonutCard(props: {
  goalId: string;
  month?: string; // optional: pass from parent if you want synced month selection
  className?: string;
}) {
  const { goalId, month: controlledMonth, className } = props;

  const [month, setMonth] = useState(() => controlledMonth ?? getMonthKey());

  // keep internal month synced if parent passes one
  useEffect(() => {
    if (controlledMonth) setMonth(controlledMonth);
  }, [controlledMonth]);

  const data = useMemo(() => loadFinanceMonth(goalId, month), [goalId, month]);

  const donutData: DonutDatum[] = useMemo(() => {
    return data.categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        value: Math.max(0, Number(c.spent) || 0),
        color: CATEGORY_COLOR[c.id],
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const totalSpent = useMemo(
    () => donutData.reduce((acc, d) => acc + d.value, 0),
    [donutData]
  );

  const isEmpty = totalSpent <= 0;

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
                Add some “spent” amounts to see the chart.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="68%"
                      outerRadius="95%"
                      paddingAngle={2}
                      stroke="transparent"
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => {
                        const n =
                          typeof value === "number"
                            ? value
                            : typeof value === "string"
                              ? Number(value)
                              : 0;

                        return [
                          `${formatDkk(Number.isFinite(n) ? n : 0)} DKK`,
                          String(name),
                        ];
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.25)",
                        background: "rgba(15,23,42,0.92)",
                        color: "white",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center label */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xs text-muted-foreground">Total spent</div>
                  <div className="text-3xl font-semibold">
                    {formatDkk(totalSpent)} DKK
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Legend */}
        <div className="rounded-2xl border bg-card/30 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Categories</div>
            {!isEmpty ? (
              <div className="text-xs text-muted-foreground">
                {donutData.length} items
              </div>
            ) : null}
          </div>

          {isEmpty ? (
            <div className="mt-4 text-sm text-muted-foreground">
              No spending yet for this month.
            </div>
          ) : (
            <div className="mt-4 max-h-[320px] overflow-auto pr-2">
              <div className="grid gap-3 sm:grid-cols-2">
                {donutData.map((d) => {
                  const pct = totalSpent > 0 ? (d.value / totalSpent) * 100 : 0;
                  return (
                    <div
                      key={d.id}
                      className="rounded-xl border p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {d.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pct.toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold whitespace-nowrap">
                          {formatDkk(d.value)} DKK
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                Tip: rent can dominate the chart — that’s normal. Watch for “Food &
                Drinks” or “Entertainment” creeping up over time.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}