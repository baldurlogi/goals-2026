import { Link } from "react-router-dom";
import { ChevronRight, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import { makeShapeFn } from "../pieShape";
import { useSpendingDashboard } from "../hooks/useSpendingDashboard";

const FINANCE_GOAL_ID = "finance"; // must match the id in your financeGoal definition

function formatDkk(n: number) {
  return new Intl.NumberFormat("da-DK").format(Math.round(n));
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

export function SpendingCard() {
  const { donutData, totalSpent, isEmpty } = useSpendingDashboard(FINANCE_GOAL_ID);

  // Top 3 categories for the compact legend
  const topCategories = donutData.slice(0, 3);

  return (
    <Card className="relative overflow-hidden lg:col-span-5">
      {/* accent stripe */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Spending this month
            </span>
          </div>
        </div>

        {/* big total */}
        <div className="mt-2 flex items-end gap-1.5">
          <span className="text-3xl font-bold tabular-nums leading-none">
            {formatDkk(totalSpent)}
          </span>
          <span className="mb-0.5 text-sm text-muted-foreground">DKK</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-5">
        {isEmpty ? (
          <div className="rounded-lg bg-muted/40 px-3 py-4 text-center">
            <p className="text-sm font-medium">No spending logged yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add expenses in the Finance goal page.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Mini donut */}
            <div className="relative h-24 w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="95%"
                    paddingAngle={2}
                    shape={makeShapeFn(donutData)}
                  />
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top categories */}
            <div className="min-w-0 flex-1 space-y-1.5">
              {topCategories.map((d) => {
                const pct = totalSpent > 0 ? (d.value / totalSpent) * 100 : 0;
                return (
                  <div key={d.id} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {d.name}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      {pct.toFixed(0)}%
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums">
                      {formatDkk(d.value)}
                    </span>
                  </div>
                );
              })}

              {donutData.length > 3 && (
                <p className="text-[10px] text-muted-foreground">
                  +{donutData.length - 3} more categories
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Link to="/goals/finance">
              Full breakdown <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}