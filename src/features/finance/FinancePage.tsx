import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { SavingsCard } from "@/features/goals/modules/finance/components/SavingsCard";
import { ExpenseTrackerCard } from "@/features/goals/modules/finance/components/ExpenseTrackerCard";
import { SpendingDonutCard } from "@/features/goals/modules/finance/components/SpendingDonutCard";
import {
  defaultFinanceState,
  getMonthKey,
  loadFinanceMonth,
  normalizeFinanceMonthState,
  saveFinanceMonth,
  type FinanceMonthState,
} from "@/features/goals/modules/finance/financeStorage";

const FINANCE_PAGE_ID = "finance";

export default function FinancePage() {
  const [month, setMonth] = useState(() => getMonthKey());
  const [monthState, setMonthState] = useState<FinanceMonthState>(() => {
    try {
      const raw = localStorage.getItem(
        `cache:finance:${FINANCE_PAGE_ID}:${getMonthKey()}`,
      );
      return raw
        ? normalizeFinanceMonthState(JSON.parse(raw), getMonthKey())
        : defaultFinanceState(getMonthKey());
    } catch {
      return defaultFinanceState(getMonthKey());
    }
  });

  useEffect(() => {
    let cancelled = false;

    loadFinanceMonth(FINANCE_PAGE_ID, month).then((fresh) => {
      if (!cancelled) setMonthState(fresh);
    });

    return () => {
      cancelled = true;
    };
  }, [month]);

  async function handleSetMonthState(next: FinanceMonthState) {
    setMonthState(next);
    await saveFinanceMonth(FINANCE_PAGE_ID, next);
    toast.success("Finance saved");
  }

  return (
    <PageScaffold width="wide">
      <PageHeader
        title="Finance"
        description="Track monthly spending, category budgets, and savings progress in one place."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ExpenseTrackerCard
            month={month}
            setMonth={setMonth}
            data={monthState}
            setData={handleSetMonthState}
          />
        </div>

        <div className="space-y-6 lg:col-span-1">
          <SavingsCard
            goalId={FINANCE_PAGE_ID}
            target={75000}
            currency="DKK"
          />
        </div>

        <div className="lg:col-span-3">
          <SpendingDonutCard goalId={FINANCE_PAGE_ID} month={month} />
        </div>
      </div>
    </PageScaffold>
  );
}
