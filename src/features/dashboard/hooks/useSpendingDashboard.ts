import { useEffect, useMemo, useState } from "react";
import {
  getMonthKey,
  loadFinanceMonth,
  defaultFinanceState,
  FINANCE_CHANGED_EVENT,
  type FinanceCategoryId,
  type FinanceMonthState,
} from "@/features/goals/modules/finance/financeStorage";

export const CATEGORY_COLOR: Record<FinanceCategoryId, string> = {
  rent:          "#10B981",
  subscriptions: "#8B5CF6",
  transport:     "#38BDF8",
  groceries:     "#84CC16",
  gym_health:    "#F472B6",
  food_drinks:   "#F59E0B",
  entertainment: "#6366F1",
  other:         "#94A3B8",
};

export type DonutDatum = {
  id: FinanceCategoryId; name: string; value: number; color: string;
};

function readCache(goalId: string, month: string): FinanceMonthState {
  try {
    const raw = localStorage.getItem(`cache:finance:${goalId}:${month}`);
    return raw ? JSON.parse(raw) : defaultFinanceState(month);
  } catch { return defaultFinanceState(month); }
}

export function useSpendingDashboard(goalId: string) {
  const month = useMemo(() => getMonthKey(), []);
  const [data,    setData]    = useState<FinanceMonthState>(() => readCache(goalId, month));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const fresh = await loadFinanceMonth(goalId, month);
      if (!cancelled) { setData(fresh); setLoading(false); }
    }

    fetch();

    const sync = () => fetch();
    window.addEventListener(FINANCE_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener(FINANCE_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [goalId, month]);

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

  return { donutData, totalSpent, month, loading, isEmpty: totalSpent <= 0 };
}