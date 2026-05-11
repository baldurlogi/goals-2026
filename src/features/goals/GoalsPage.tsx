import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, ChevronLeft, ChevronRight} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useGoalProgressState } from '@/features/goals/goalStore';
import { GoalCard } from './components/GoalCard';
import { AddEditGoalModal } from './components/AddEditGoalModal';
import { ImproveGoalModal } from './components/ImproveGoalModal';
import { GoalsPageSkeleton } from '@/features/dashboard/skeletons';
import { useTier, tierMeets } from '@/features/subscription/useTier';
import { GoalRemotePersistenceError } from './userGoalStorage';
import { useDeleteGoalMutation, useGoalsState, useSaveGoalMutation } from './useGoalsQuery';
import type { UserGoal, UserGoalStep } from './goalTypes';
import type { GoalPersistenceStatus } from './userGoalStorage';
import { getLocalDateKey } from '@/hooks/useTodayDate';
import { AIContextNudge } from './components/AIContextNudge';
import { useAuth } from '@/features/auth/authContext';
import { queryKeys } from '@/lib/queryKeys';
import type { ReactNode } from 'react';

const GOALS_PER_PAGE = 5;

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
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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

function isGoalCompleted(
  goal: UserGoal,
  doneState: Record<string, Record<string, boolean>>,
) {
  return (
    goal.steps.length > 0 &&
    goal.steps.every((step) => Boolean(doneState[goal.id]?.[step.id]))
  );
}

export function GoalsPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { doneState: done, isGoalProgressLoading } = useGoalProgressState();
  const { goals, isGoalsLoading } = useGoalsState();
  const deleteGoalMutation = useDeleteGoalMutation();
  const saveGoalMutation = useSaveGoalMutation();
  const [sort, setSort] = useState<SortMode>('priority');
  const [localModal, setLocalModal] = useState<ModalState>(null);
  const [improvingGoal, setImprovingGoal] = useState<UserGoal | null>(null);
  const tier = useTier();
  const isPro = tierMeets(tier, 'pro');
  const loading = isGoalsLoading || isGoalProgressLoading;
  const location = useLocation();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(0);

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

  function upsertGoalInCache(saved: UserGoal) {
    queryClient.setQueryData<UserGoal[]>(queryKeys.goals(userId), (previous = []) => {
      const index = previous.findIndex((goal) => goal.id === saved.id);

      if (index === -1) {
        return [...previous, saved];
      }

      const next = [...previous];
      next[index] = saved;
      return next;
    });

    void Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(userId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardGoals(userId) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboardLifeProgress(userId),
      }),
    ]);
  }

  const today = getLocalDateKey();

  const overdueCountByGoal = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const goal of goals) {
      counts[goal.id] = goal.steps.filter(
        (s: UserGoalStep) =>
          s.idealFinish &&
          s.idealFinish < today &&
          !done[goal.id]?.[s.id],
      ).length;
    }
    return counts;
  }, [done, goals, today]);

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

  const activeGoals = useMemo(
    () => sorted.filter((goal) => !isGoalCompleted(goal, done)),
    [done, sorted],
  );

  const completedGoals = useMemo(
    () =>
      sorted
        .filter((goal) => isGoalCompleted(goal, done))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [done, sorted],
  );

  const paginatedActiveGoals = useMemo(() => {
    const start = activePage * GOALS_PER_PAGE;
    return activeGoals.slice(start, start + GOALS_PER_PAGE);
  }, [activeGoals, activePage]);

  const maxActivePage = Math.ceil(activeGoals.length / GOALS_PER_PAGE) - 1;

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

  function handleSaved(saved: UserGoal) {
    upsertGoalInCache(saved);
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
              : activeGoals.length === 0
                ? 'All your current goals are complete. Start a new one when you are ready.'
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
              onClick={() => setLocalModal('ai')}
              className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-500 hover:text-white sm:w-auto"
            >
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Button>
          </div>

          {goals.length > 0 && (
            <div className="order-2 flex items-center gap-1 rounded-xl border bg-card p-1 sm:order-1">
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
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => setLocalModal('ai')}
              className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-500 hover:text-white sm:w-auto"
            >
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Button>
            <Button
              onClick={() => setLocalModal('new')}
              variant="ghost"
              className="w-full gap-2 sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Add manually
            </Button>
          </div>
        </div>
      )}

      {!loading && 
      activeGoals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">
                Active goals
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeGoals.length} goal{activeGoals.length === 1 ? '' : 's'} in progress
              </p>
            </div>
          </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {paginatedActiveGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  doneMap={done[goal.id]}
                  overdueCount={overdueCountByGoal[goal.id] ?? 0}
                  onEdit={() => setLocalModal(goal)}
                  onDelete={() => handleDelete(goal.id)}
                  onImprove={isPro ? () => setImprovingGoal(goal) : undefined}
                />
              ))}
            </div>

            {activeGoals.length > GOALS_PER_PAGE && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                onClick={() => setActivePage(Math.max(0, activePage - 1))}
                disabled={activePage === 0}
                variant="ghost"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {activePage + 1} of {maxActivePage + 1}
              </span>
              <Button
                onClick={() => setActivePage(Math.min(maxActivePage, activePage + 1))}
                disabled={activePage === maxActivePage}
                variant="ghost"
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      )}

      {!loading && activeGoals.length === 0 && completedGoals.length > 0 && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <div className="text-3xl">🏁</div>
          <div className="mt-3 text-lg font-semibold">All current goals completed</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Your finished goals are saved below. Start a new goal whenever you want to build fresh momentum.
          </p>
        </div>
      )}

      {!loading && completedGoals.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Completed goals
            </h3>
            <p className="mt-1 text-sm text-muted-foreground text-amber-500 dark:text-amber-200">
              {completedGoals.length} goal{completedGoals.length === 1 ? '' : 's'} finished
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                doneMap={done[goal.id]}
                isCompleted
                onEdit={() => setLocalModal(goal)}
                onDelete={() => handleDelete(goal.id)}
                onImprove={isPro ? () => setImprovingGoal(goal) : undefined}
              />
            ))}
          </div>
        </section>
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
              .then((status: GoalPersistenceStatus) => {
                if (status.remoteSyncSucceeded) {
                  toast.success('Goal steps improved ✨');
                } else {
                  toast.warning("Goal steps improved locally, syncing failed. We'll retry.");
                }
              })
              .catch((error: unknown) => {
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
