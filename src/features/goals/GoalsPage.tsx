import { useEffect, useMemo, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useGoalsStore } from '@/features/goals/goalStoreContext';
import { GoalCard } from './components/GoalCard';
import { AddEditGoalModal } from './components/AddEditGoalModal';
import { ImproveGoalModal } from './components/ImproveGoalModal';
import { GoalsPageSkeleton } from '@/features/dashboard/skeletons';
import { useTier, tierMeets } from '@/features/subscription/useTier';
import {
  loadUserGoals,
  seedUserGoals,
  deleteUserGoal,
  saveUserGoal,
} from './userGoalStorage';
import type { UserGoal } from './goalTypes';

type SortMode = 'priority' | 'overdue';
type ModalState = UserGoal | 'new' | 'ai' | null;

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function GoalsPage() {
  const { state } = useGoalsStore();
  const [goals, setGoals]           = useState<UserGoal[]>(() => seedUserGoals());
  const [loading, setLoading]       = useState(goals.length === 0);
  const [sort, setSort]             = useState<SortMode>('priority');
  const [modal, setModal]           = useState<ModalState>(null);
  const [improvingGoal, setImprovingGoal] = useState<UserGoal | null>(null);
  const tier = useTier();
  const isPro = tierMeets(tier, "pro");

  useEffect(() => {
    let cancelled = false;
    loadUserGoals().then((fresh) => {
      if (!cancelled) { setGoals(fresh); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const overdueCountByGoal = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const goal of goals) {
      counts[goal.id] = goal.steps.filter(
        (s) => s.idealFinish && s.idealFinish < today && !state.done[goal.id]?.[s.id],
      ).length;
    }
    return counts;
  }, [goals, state.done, today]);

  const sorted = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (sort === 'priority') {
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
    setModal(null);
  }

  const cacheEmpty = goals.length === 0;
  if (loading && cacheEmpty) return <GoalsPageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Goals</h2>
          <p className="text-sm text-muted-foreground">
            {goals.length === 0
              ? 'Add your first goal to get started.'
              : 'Check off steps to update progress automatically.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {goals.length > 0 && (
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
              <SortButton active={sort === 'priority'} onClick={() => setSort('priority')}>
                Priority
              </SortButton>
              <SortButton active={sort === 'overdue'} onClick={() => setSort('overdue')}>
                Most overdue
              </SortButton>
            </div>
          )}
          {/* AI generate button */}
          <Button
            variant="outline"
            onClick={() => setModal('ai')}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
          >
            <Sparkles className="h-4 w-4" /> Generate with AI
          </Button>
          <Button onClick={() => setModal('new')} className="gap-2 hover:border-primary/30 hover:text-white bg-primary/5 text-primary">
            <Plus className="h-4 w-4" /> Add goal
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {!loading && goals.length === 0 && (
        <div className="space-y-6 rounded-2xl border border-dashed p-12 text-center">
          <div className="text-4xl">🎯</div>
          <div>
            <div className="text-lg font-semibold">No goals yet</div>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Describe what you want to achieve and let AI build a step-by-step plan — or create one manually.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setModal('ai')}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
            >
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Button>
            <Button onClick={() => setModal('new')} variant="ghost" className="gap-2">
              <Plus className="h-4 w-4" /> Add manually
            </Button>
          </div>
        </div>
      )}

      {/* Goal grid */}
      {!loading && sorted.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {sorted.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              doneMap={state.done[goal.id]}
              overdueCount={overdueCountByGoal[goal.id] ?? 0}
              onEdit={() => setModal(goal)}
              onDelete={() => handleDelete(goal.id)}
              onImprove={isPro ? () => setImprovingGoal(goal) : undefined}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <AddEditGoalModal
          initial={modal === 'new' || modal === 'ai' ? undefined : modal}
          startWithAI={modal === 'ai'}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      )}

      {/* Improve modal */}
      {improvingGoal && (
        <ImproveGoalModal
          goal={improvingGoal}
          onApply={(newSteps) => {
            const updated: UserGoal = {
              ...improvingGoal,
              steps: newSteps,
              updatedAt: new Date().toISOString(),
            };
            handleSaved(updated);
            saveUserGoal(updated);
            setImprovingGoal(null);
            toast.success('Goal steps improved ✨');
          }}
          onClose={() => setImprovingGoal(null)}
        />
      )}
    </div>
  );
}

function SortButton({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {children}
    </button>
  );
}