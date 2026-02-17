import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import {
  getMonthKey,
  shiftMonth,
  defaultFinanceState,
  type FinanceMonthState,
  type FinanceCategoryId,
} from "../financeStorage";

function formatDkk(n: number) {
  return new Intl.NumberFormat("da-DK").format(Math.round(n));
}

function toNumber(s: string) {
  const cleaned = s.replace(/\./g, "").replace(",", ".").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, 1);
  return dt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function ExpenseTrackerCard(props: {
  goalId: string;
  month: string;
  setMonth: (m: string) => void;
  data: FinanceMonthState;
  setData: Dispatch<SetStateAction<FinanceMonthState>>;
  className?: string;
}) {
  const { goalId, month, setMonth, data, setData, className } = props;

  const totals = useMemo(() => {
    const totalSpent = data.categories.reduce((acc, c) => acc + (c.spent || 0), 0);
    const totalBudget = data.categories.reduce((acc, c) => acc + (c.budget || 0), 0);
    const leftover = (data.income || 0) - totalSpent;
    return { totalSpent, totalBudget, leftover };
  }, [data]);

  function updateIncome(v: string) {
    setData((prev) => ({ ...prev, income: toNumber(v) }));
  }

  function updateCategory(
    id: FinanceCategoryId,
    patch: Partial<{ budget: number; spent: number }>
  ) {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id
          ? {
              ...c,
              budget: patch.budget ?? c.budget,
              spent: patch.spent ?? c.spent,
            }
          : c
      ),
    }));
  }

  function quickAdd(id: FinanceCategoryId, delta: number) {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, spent: Math.max(0, (c.spent || 0) + delta) } : c
      ),
    }));
  }

  function resetMonth() {
    // Hard reset this month back to defaults
    setData(defaultFinanceState(month));
  }

  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-sm space-y-4", className)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Expense tracker</div>
          <div className="text-lg font-semibold">Monthly budget</div>
          <div className="text-sm text-muted-foreground">{monthLabel(month)}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMonth(shiftMonth(month, -1))}>
            ←
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMonth(getMonthKey())}>
            This month
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMonth(shiftMonth(month, 1))}>
            →
          </Button>
        </div>
      </div>

      {/* Income + summary */}
      <div className="grid gap-3">
        <div className="grid gap-2">
          <div className="text-sm font-medium">Income (net)</div>
          <Input
            key={`income-${month}`}
            inputMode="numeric"
            placeholder="e.g. 35.000"
            defaultValue={data.income ? String(data.income) : ""}
            onBlur={(e) => updateIncome(e.target.value)}
          />
          <div className="text-xs text-muted-foreground">Tip: type amount and click outside to save.</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Total spent</div>
            <div className="text-sm font-semibold">{formatDkk(totals.totalSpent)} DKK</div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="text-sm text-muted-foreground">Leftover</div>
            <div
              className={cn(
                "text-sm font-semibold",
                totals.leftover >= 0 ? "text-emerald-500" : "text-destructive"
              )}
            >
              {formatDkk(totals.leftover)} DKK
            </div>
          </div>

          {totals.totalBudget > 0 ? (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Budget usage: {formatDkk(totals.totalSpent)}/{formatDkk(totals.totalBudget)} DKK
                </span>
                <span>
                  {Math.round(clamp((totals.totalSpent / totals.totalBudget) * 100, 0, 999))}%
                </span>
              </div>

              <Progress
                value={clamp((totals.totalSpent / totals.totalBudget) * 100, 0, 100)}
                className="h-2"
                indicatorClassName={
                  totals.totalSpent <= totals.totalBudget ? "bg-emerald-500" : "bg-destructive"
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Categories</div>
          <Button variant="ghost" size="sm" onClick={resetMonth}>
            Reset month
          </Button>
        </div>

        <div className="space-y-3">
          {data.categories.map((c) => {
            const remaining = (c.budget || 0) - (c.spent || 0);
            const pct = c.budget > 0 ? clamp((c.spent / c.budget) * 100, 0, 100) : 0;
            const over = c.budget > 0 && c.spent > c.budget;

            return (
              <div key={c.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Remaining:{" "}
                      <span className={over ? "text-destructive font-medium" : "text-emerald-500 font-medium"}>
                        {formatDkk(remaining)} DKK
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Spent</div>
                    <div className="text-sm font-semibold">{formatDkk(c.spent)} DKK</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Budget</div>
                    <Input
                      key={`budget-${month}-${c.id}`}
                      inputMode="numeric"
                      placeholder="0"
                      defaultValue={c.budget ? String(c.budget) : ""}
                      onBlur={(e) => updateCategory(c.id, { budget: toNumber(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Spent</div>
                    <Input
                      key={`spent-${month}-${c.id}`}
                      inputMode="numeric"
                      placeholder="0"
                      defaultValue={c.spent ? String(c.spent) : ""}
                      onBlur={(e) => updateCategory(c.id, { spent: toNumber(e.target.value) })}
                    />
                  </div>
                </div>

                {c.budget > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatDkk(c.spent)}/{formatDkk(c.budget)} DKK
                      </span>
                      <span>{Math.round((c.spent / c.budget) * 100)}%</span>
                    </div>

                    <Progress
                      value={pct}
                      className="h-2"
                      indicatorClassName={over ? "bg-destructive" : "bg-emerald-500"}
                    />
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Set a budget to track progress.</div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => quickAdd(c.id, 50)}>+50</Button>
                  <Button variant="secondary" size="sm" onClick={() => quickAdd(c.id, 100)}>+100</Button>
                  <Button variant="secondary" size="sm" onClick={() => quickAdd(c.id, 250)}>+250</Button>
                  <Button variant="secondary" size="sm" onClick={() => quickAdd(c.id, 500)}>+500</Button>
                  <Button variant="ghost" size="sm" onClick={() => quickAdd(c.id, -100)}>−100</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Leftover = income − total spent. Use it to decide how much to transfer into savings.
      </div>
    </div>
  );
}
