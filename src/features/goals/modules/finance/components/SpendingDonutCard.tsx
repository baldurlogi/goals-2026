import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import { getMonthKey, loadFinanceMonth } from "../financeStorage";
import { CATEGORY_COLOR, type DonutDatum } from "@/app/hooks/useSpendingDashboard";
import { makeShapeFn } from "@/app/pieShape";
import type { FinanceMonthState } from "../financeStorage";

function formatDkk(n: number) {
  return new Intl.NumberFormat("da-DK").format(Math.round(n));
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}




// Custom tooltip — uses CSS vars so it works in both light and dark mode
function DonutTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { color } } = payload[0];
  return (
    <div
      style={{
        background: "hsl(var(--popover))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 8,
        padding: "6px 10px",
        color: "hsl(var(--popover-foreground))",
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontWeight: 600 }}>{name}</span>
      </div>
      <div style={{ marginTop: 2, paddingLeft: 14 }}>
        {new Intl.NumberFormat("da-DK").format(Math.round(value))} DKK
      </div>
    </div>
  );
}

export function SpendingDonutCard(props: {
  goalId: string;
  month?: string;
  data?: FinanceMonthState;
  className?: string;
}) {
  const { goalId, month: controlledMonth, className } = props;
  const [month, setMonth] = useState(() => controlledMonth ?? getMonthKey());

  useEffect(() => {
    if (controlledMonth) setMonth(controlledMonth);
  }, [controlledMonth]);

  const data = useMemo(() => {
    return props.data ?? loadFinanceMonth(goalId, month);
  }, [props.data, goalId, month]);

  const donutData: DonutDatum[] = useMemo(() =>
    data.categories
      .map((c) => ({
        id:    c.id,
        name:  c.name,
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
        {/* Donut */}
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
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="68%"
                      outerRadius="95%"
                      paddingAngle={2}
                      shape={makeShapeFn(donutData)}
                    />
                      <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center label */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xs text-muted-foreground">Total spent</div>
                  <div className="text-3xl font-semibold">{formatDkk(totalSpent)} DKK</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-2xl border bg-card/30 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Categories</div>
            {!isEmpty && (
              <div className="text-xs text-muted-foreground">{donutData.length} items</div>
            )}
          </div>

          {isEmpty ? (
            <div className="mt-4 text-sm text-muted-foreground">No spending yet for this month.</div>
          ) : (
            <div className="mt-4 max-h-[320px] overflow-auto pr-2">
              <div className="grid gap-3 sm:grid-cols-2">
                {donutData.map((d) => {
                  const pct = totalSpent > 0 ? (d.value / totalSpent) * 100 : 0;
                  return (
                    <div key={d.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{d.name}</div>
                          <div className="text-xs text-muted-foreground">{pct.toFixed(0)}%</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold whitespace-nowrap">{formatDkk(d.value)} DKK</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Tip: rent can dominate the chart — that's normal. Watch for Food & Drinks or Entertainment creeping up.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}