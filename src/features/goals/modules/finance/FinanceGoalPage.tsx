import { useEffect, useState } from "react";

import { SavingsCard } from "./components/SavingsCard";
import { ExpenseTrackerCard } from "./components/ExpenseTrackerCard";
import { SpendingDonutCard } from "./components/SpendingDonutCard";

import {
  getMonthKey,
  loadFinanceMonth,
  saveFinanceMonth,
  defaultFinanceState,
  type FinanceMonthState,
} from "./financeStorage";

const GOAL_ID = "finance";

export function FinanceGoalPage() {
  const [month, setMonth] = useState(() => getMonthKey());
  const [monthState, setMonthState] = useState<FinanceMonthState>(() => {
    try {
      const raw = localStorage.getItem(`cache:finance:${GOAL_ID}:${getMonthKey()}`);
      return raw ? JSON.parse(raw) : defaultFinanceState(getMonthKey());
    } catch { return defaultFinanceState(getMonthKey()); }
  });

  useEffect(() => {
    let cancelled = false;
    loadFinanceMonth(GOAL_ID, month).then((fresh) => {
      if (!cancelled) setMonthState(fresh);
    });
    return () => { cancelled = true; };
  }, [month]);

  async function handleSetMonthState(next: FinanceMonthState) {
    setMonthState(next);
    await saveFinanceMonth(GOAL_ID, next);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">💰 Finance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track savings, monthly spending, and budget categories.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ExpenseTrackerCard
            month={month}
            setMonth={setMonth}
            data={monthState}
            setData={handleSetMonthState}
          />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <SavingsCard goalId={GOAL_ID} target={75000} currency="DKK" />
        </div>

        <div className="lg:col-span-3">
          <SpendingDonutCard goalId={GOAL_ID} month={month} />
        </div>
      </div>
    </div>
  );
}