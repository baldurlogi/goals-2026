import { useEffect, useState } from "react";
import { useGoalsStore } from "@/features/goals/goalStore";
import { financeGoal } from "./financeGoal";

import { GoalPageHeader } from "@/features/goals/components/GoalPageHeader";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { TimelineCard } from "@/features/goals/components/TimelineCard";

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

export function FinanceGoalPage() {
  const { state, dispatch } = useGoalsStore();

  const goalId = financeGoal.id;
  const doneMap = state.done[goalId] ?? {};

  const [month, setMonth] = useState(() => getMonthKey());
  const [monthState, setMonthState] = useState<FinanceMonthState>(() => {
    try {
      const raw = localStorage.getItem(`cache:finance:${goalId}:${getMonthKey()}`);
      return raw ? JSON.parse(raw) : defaultFinanceState(getMonthKey());
    } catch { return defaultFinanceState(getMonthKey()); }
  });


  useEffect(() => {
    let cancelled = false;
    loadFinanceMonth(goalId, month).then((fresh) => {
      if (!cancelled) setMonthState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId, month]);

  async function handleSetMonthState(next: FinanceMonthState) {
    setMonthState(next);
    await saveFinanceMonth(goalId, next);
  }

  return (
    <div className="space-y-6">
      <GoalPageHeader
        goal={financeGoal}
        doneMap={doneMap}
        onReset={() => dispatch({ type: "resetGoal", goalId })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <StepsCard
            goalId={goalId}
            goalTitle={financeGoal.title}
            steps={financeGoal.steps}
            doneMap={doneMap}
            onToggle={(stepId) => dispatch({ type: "toggleStep", goalId, stepId })}
            heightClassName="h-[640px]"
          />

          <TimelineCard steps={financeGoal.steps} doneMap={doneMap} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <SavingsCard goalId={goalId} target={75000} currency="DKK" />

          <ExpenseTrackerCard
            month={month}
            setMonth={setMonth}
            data={monthState}
            setData={handleSetMonthState}
          />
        </div>

        <div className="lg:col-span-3">
          <SpendingDonutCard goalId={goalId} month={month} />
        </div>
      </div>
    </div>
  );
}