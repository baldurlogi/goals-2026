import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoalsStore } from "@/features/goals/goalStoreContext";
import { GoalCard } from "./components/GoalCard";
import { AddEditGoalModal } from "./components/AddEditGoalModal";
import {
  loadUserGoals,
  seedUserGoals,
  deleteUserGoal,
} from "./userGoalStorage";
import type { UserGoal } from "./goalTypes";

type SortMode = "priority" | "overdue";
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function GoalsTab() {
  const { state } = useGoalsStore();
  const [goals, setGoals] = useState<UserGoal[]>(() => seedUserGoals());
  const [loading, setLoading] = useState(goals.length === 0);
  const [sort, setSort] = useState<SortMode>("priority");
  const [modalGoal, setModalGoal] = useState<UserGoal | "new" | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    loadUserGoals().then((fresh) => {
      if (!cancelled) { setGoals(fresh); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  // Overdue counts per goal
  const today = new Date().toISOString().slice(0, 10);
  const overdueCountByGoal = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const goal of goals) {
      counts[goal.id] = goal.steps.filter(
        (s) => s.idealFinish && s.idealFinish < today && !state.done[goal.id]?.[s.id]
      ).length;
    }
    return counts;
  }, [goals, state.done, today]);

  const sorted = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (sort === "priority") {
        const r = (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
        if (r !== 0) return r;
        return (overdueCountByGoal[b.id] ?? 0) - (overdueCountByGoal[a.id] ?? 0);
      }
      const od = (overdueCountByGoal[b.id] ?? 0) - (overdueCountByGoal[a.id] ?? 0);
      if (od !== 0) return od;
      return (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
    });
  }, [goals, sort, overdueCountByGoal]);

  async function handleDelete(goalId: string) {
    if (!confirm("Delete this goal? This can't be undone.")) return;
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    await deleteUserGoal(goalId);
  }

  function handleSaved(saved: UserGoal) {
    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    setModalGoal(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Goals</h2>
          <p className="text-sm text-muted-foreground">
            {goals.length === 0
              ? "Add your first goal to get started."
              : "Check off steps to update progress automatically."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {goals.length > 0 && (
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
              <SortButton active={sort === "priority"} onClick={() => setSort("priority")}>
                Priority
              </SortButton>
              <SortButton active={sort === "overdue"} onClick={() => setSort("overdue")}>
                Most overdue
              </SortButton>
            </div>
          )}
          <Button onClick={() => setModalGoal("new")} className="gap-2">
            <Plus className="h-4 w-4" /> Add goal
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 space-y-4 animate-pulse">
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="h-2 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && goals.length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center space-y-4">
          <div className="text-4xl">🎯</div>
          <div>
            <div className="font-semibold text-lg">No goals yet</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Create a goal, break it into steps, and track your progress here.
            </p>
          </div>
          <Button onClick={() => setModalGoal("new")} className="gap-2">
            <Plus className="h-4 w-4" /> Add your first goal
          </Button>
        </div>
      )}

      {/* Goals grid */}
      {!loading && sorted.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {sorted.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              doneMap={state.done[goal.id]}
              overdueCount={overdueCountByGoal[goal.id] ?? 0}
              onEdit={() => setModalGoal(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalGoal !== null && (
        <AddEditGoalModal
          initial={modalGoal === "new" ? undefined : modalGoal}
          onSave={handleSaved}
          onClose={() => setModalGoal(null)}
        />
      )}
    </div>
  );
}

function SortButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}