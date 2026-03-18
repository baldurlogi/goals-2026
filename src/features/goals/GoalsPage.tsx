import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useGoalsStore } from '@/features/goals/goalStoreContext';
import { GoalCard } from './components/GoalCard';
import { AddEditGoalModal } from './components/AddEditGoalModal';
import { ImproveGoalModal } from './components/ImproveGoalModal';
import { GoalsPageSkeleton } from '@/features/dashboard/skeletons';
import { useTier, tierMeets } from '@/features/subscription/useTier';
import { GoalRemotePersistenceError } from './userGoalStorage';
import { useDeleteGoalMutation, useGoalsQuery, useSaveGoalMutation } from './useGoalsQuery';
import type { UserGoal } from './goalTypes';
import { getLocalDateKey } from '@/hooks/useTodayDate';
import { AIContextNudge } from './components/AIContextNudge';
import type { ReactNode } from 'react';

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}


type SortMode = 'priority' | 'overdue';
type ModalState = UserGoal | 'new' | 'ai' | null;
type GoalRouteState = { openGoalModal?: 'new' | 'ai' } | null;

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function GoalsPage() {
  const { state } = useGoalsStore();
  const { data: goals = [], isLoading: loading } = useGoalsQuery();
  const deleteGoalMutation = useDeleteGoalMutation();
  const saveGoalMutation = useSaveGoalMutation();
  const [sort, setSort] = useState<SortMode>('priority');
  const [localModal, setLocalModal] = useState<ModalState>(null);
  const [improvingGoal, setImprovingGoal] = useState<UserGoal | null>(null);
  const tier = useTier();
  const isPro = tierMeets(tier, 'pro');
  const location = useLocation();
  const navigate = useNavigate();

  const routeModal = (() => {
    const requested = (location.state as GoalRouteState | null)?.openGoalModal;
    return requested === 'new' || requested === 'ai' ? requested : null;
  })();

  const modal = localModal ?? routeModal;

  function closeModal() {
    setLocalModal(null);

    if (routeModal) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }

  const today = getLocalDateKey();

  const overdueCountByGoal = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const goal of goals) {
      counts[goal.id] = goal.steps.filter(
        (s) =>
          s.idealFinish &&
          s.idealFinish < today &&
          !state.done[goal.id]?.[s.id],
      ).length;
    }
    return counts;
  }, [goals, state.done, today]);

  const sorted = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (sort === 'priority') {
        const r =
          (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
        if (r !== 0) return r;
        return (
          (overdueCountByGoal[b.id] ?? 0) - (overdueCountByGoal[a.id] ?? 0)
        );
      }
      const od =
        (overdueCountByGoal[b.id] ?? 0) - (overdueCountByGoal[a.id] ?? 0);
      if (od !== 0) return od;
      return (
        (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)
      );
    });
  }, [goals, sort, overdueCountByGoal]);

  async function handleDelete(goalId: string) {
    if (!confirm("Delete this goal? This can't be undone.")) return;

    try {
      const status = await deleteGoalMutation.mutateAsync(goalId);
      if (!status.remoteSyncSucceeded) {
        toast.warning("Deleted locally, syncing failed. We'll retry.");
      }
    } catch (error) {
      if (error instanceof GoalRemotePersistenceError) {
        toast.error('Delete failed to sync. Goal was restored.');
        return;
      }

      toast.error('Delete failed. Please try again.');
    }
  }

  function handleSaved(_saved: UserGoal) {
    closeModal();
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

        <div className="flex w-full flex-wrap items-end justify-end gap-2 sm:w-auto">
          <div className="order-1 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              onClick={() => setLocalModal('new')}
              className="w-full gap-2 sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Add goal
            </Button>

            <Button
              variant="outline"
              onClick={() => setLocalModal('ai')}
              className="w-full gap-2 sm:w-auto"
            >
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Button>
          </div>

          {goals.length > 0 && (
            <div className="order-2 flex items-center gap-1 rounded-lg border bg-card p-1 sm:order-1">
              <SortButton
                active={sort === 'priority'}
                onClick={() => setSort('priority')}
              >
                Priority
              </SortButton>
              <SortButton
                active={sort === 'overdue'}
                onClick={() => setSort('overdue')}
              >
                Most overdue
              </SortButton>
            </div>
          )}
        </div>
      </div>

      <AIContextNudge />

      {!loading && goals.length === 0 && (
        <div className="space-y-6 rounded-2xl border border-dashed p-12 text-center">
          <div className="text-4xl">🎯</div>
          <div>
            <div className="text-lg font-semibold">No goals yet</div>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Describe what you want to achieve and let AI build a step-by-step
              plan — or create one manually.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setLocalModal('ai')}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
            >
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Button>
            <Button
              onClick={() => setLocalModal('new')}
              variant="ghost"
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add manually
            </Button>
          </div>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {sorted.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              doneMap={state.done[goal.id]}
              overdueCount={overdueCountByGoal[goal.id] ?? 0}
              onEdit={() => setLocalModal(goal)}
              onDelete={() => handleDelete(goal.id)}
              onImprove={isPro ? () => setImprovingGoal(goal) : undefined}
            />
          ))}
        </div>
      )}

      {modal !== null && (
        <AddEditGoalModal
          initial={modal === 'new' || modal === 'ai' ? undefined : modal}
          startWithAI={modal === 'ai'}
          onSave={handleSaved}
          onClose={closeModal}
        />
      )}

      {improvingGoal && (
        <ImproveGoalModal
          goal={improvingGoal}
          onApply={(newSteps) => {
            const updated: UserGoal = {
              ...improvingGoal,
              steps: newSteps,
              updatedAt: getLocalDateKey(),
            };
            handleSaved(updated);
            setImprovingGoal(null);

            void saveGoalMutation.mutateAsync(updated)
              .then((status) => {
                if (status.remoteSyncSucceeded) {
                  toast.success('Goal steps improved ✨');
                } else {
                  toast.warning("Goal steps improved locally, syncing failed. We'll retry.");
                }
              })
              .catch((error) => {
                if (error instanceof GoalRemotePersistenceError && error.localCacheWriteSucceeded) {
                  toast.warning("Goal steps improved locally, syncing failed. We'll retry.");
                  return;
                }
                toast.error('Could not sync improved steps. Please try again.');
              });
          }}
          onClose={() => setImprovingGoal(null)}
        />
      )}
    </div>
  );
}
