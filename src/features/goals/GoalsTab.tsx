import { goalsRegistry } from "./registry";
import { useGoalsStore } from "./goalStore";
import { GoalCard } from "./components/GoalCard";
import { getUpcomingSteps } from "./goalUtils";
import { useMemo, useState } from "react";

type SortMode = "priority" | "overdue";

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2};

// Large horizon so we catch all overdue regardless of date
const OVERDUE_HORIZON = 9999;

export function GoalsTab() {
  const { state } = useGoalsStore();
  const [sort, setSort] = useState<SortMode>("priority");

  // Count overdue incomplete steps per goal
  const overdueCountByGoal = useMemo<Record<string, number>>(() => {
    const items = getUpcomingSteps(goalsRegistry, state.done, OVERDUE_HORIZON);
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (item.daysFromToday < 0) {
        counts[item.goalId] = (counts[item.goalId] ?? 0) + 1;
      }
    }
    return counts;
  }, [state.done]);

  const sorted = useMemo(() => {
    return [...goalsRegistry].sort((a, b) => {
      if (sort === "priority") {
        const rankDiff = (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
        if (rankDiff !== 0) return rankDiff;
        // tiebreak: most overdue within same priority
        return (overdueCountByGoal[b.id] ?? 0) - (overdueCountByGoal[a.id] ?? 0);
      }
      // overdue mode: most overdue first, then fall back to priority
      const overdueDiff = (overdueCountByGoal[b.id] ?? 0) - (overdueCountByGoal[a.id] ?? 0);
      if (overdueDiff !== 0) return overdueDiff;
      return (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
    })
  }, [sort, overdueCountByGoal])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">2026 Goals</h2>
          <p className="text-sm text-muted-foreground">
            Check off steps to update progress automatically.
          </p>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          <SortButton active={sort === "priority"} onClick={() => setSort("priority")}>
            Priority
          </SortButton>
          <SortButton active={sort === "overdue"} onClick={() => setSort("overdue")}>
            Most overdue
          </SortButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {sorted.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            doneMap={state.done[goal.id]}
            overdueCount={overdueCountByGoal[goal.id] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={["rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      ].join(" ")}
    >
      {children}
    </button>
  )
}
