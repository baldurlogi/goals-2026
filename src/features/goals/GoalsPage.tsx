import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
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

const SECONDARY_GOALS_PER_PAGE = 6;

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

type SortMode = 'priority' | 'attention';
type ModalState = UserGoal | null;
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

function getGoalProgress(
  goal: UserGoal,
  doneState: Record<string, Record<string, boolean>>,
) {
  const total = goal.steps.length;
  const doneCount = goal.steps.filter((step) => doneState[goal.id]?.[step.id]).length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return { doneCount, pct, total };
}

function getAttentionScore(
  goal: UserGoal,
  doneState: Record<string, Record<string, boolean>>,
  overdueCount: number,
) {
  const { doneCount, pct, total } = getGoalProgress(goal, doneState);
  const priorityWeight = goal.priority === 'high' ? 24 : goal.priority === 'medium' ? 12 : 0;
  const untouchedWeight = total > 0 && doneCount === 0 ? 80 : 0;

  return overdueCount * 180 + untouchedWeight + (100 - pct) + priorityWeight;
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
  const [showArchive, setShowArchive] = useState(false);
  const tier = useTier();
  const isPro = tierMeets(tier, 'pro');
  const loading = isGoalsLoading || isGoalProgressLoading;
  const location = useLocation();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(0);

  const routeCreateMode = (() => {
    const requested = (location.state as GoalRouteState | null)?.openGoalModal;
    return requested === 'new' || requested === 'ai' ? requested : null;
  })();

  useEffect(() => {
    if (!routeCreateMode) return;

    navigate(`/app/goals/${routeCreateMode}`, { replace: true, state: null });
  }, [navigate, routeCreateMode]);

  useEffect(() => {
    setActivePage(0);
  }, [sort]);

  function closeModal() {
    setLocalModal(null);
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
      const priorityDelta =
        (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);

      if (sort === 'priority') {
        if (priorityDelta !== 0) return priorityDelta;

        const aProgress = getGoalProgress(a, done).pct;
        const bProgress = getGoalProgress(b, done).pct;
        return aProgress - bProgress;
      }

      const attentionDelta =
        getAttentionScore(b, done, overdueCountByGoal[b.id] ?? 0) -
        getAttentionScore(a, done, overdueCountByGoal[a.id] ?? 0);

      if (attentionDelta !== 0) return attentionDelta;
      return priorityDelta;
    });
  }, [done, goals, sort, overdueCountByGoal]);

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

  const featuredGoal = activeGoals[0] ?? null;
  const secondaryActiveGoals = useMemo(() => activeGoals.slice(1), [activeGoals]);

  const paginatedSecondaryGoals = useMemo(() => {
    const start = activePage * SECONDARY_GOALS_PER_PAGE;
    return secondaryActiveGoals.slice(start, start + SECONDARY_GOALS_PER_PAGE);
  }, [activePage, secondaryActiveGoals]);

  const maxActivePage = Math.max(
    0,
    Math.ceil(secondaryActiveGoals.length / SECONDARY_GOALS_PER_PAGE) - 1,
  );

  useEffect(() => {
    setActivePage((current) => Math.min(current, maxActivePage));
  }, [maxActivePage]);

  const activeStepCount = useMemo(
    () => activeGoals.reduce((sum, goal) => sum + goal.steps.length, 0),
    [activeGoals],
  );

  const completedStepCount = useMemo(
    () =>
      activeGoals.reduce(
        (sum, goal) => sum + goal.steps.filter((step) => done[goal.id]?.[step.id]).length,
        0,
      ),
    [activeGoals, done],
  );

  const overallMomentum = activeStepCount === 0
    ? 0
    : Math.round((completedStepCount / activeStepCount) * 100);
  const totalOverdue = activeGoals.reduce(
    (sum, goal) => sum + (overdueCountByGoal[goal.id] ?? 0),
    0,
  );
  const systemObservation = activeGoals.length === 0
    ? 'Your active field is clear. This is a good moment to choose the next meaningful trajectory.'
    : totalOverdue > 0
      ? 'A few paths are asking to be simplified. Reduce scope before adding more pressure.'
      : overallMomentum >= 70
        ? 'Your trajectory field is moving well. Protect the rhythm and finish one path cleanly.'
        : overallMomentum > 0
          ? 'Momentum exists. The best move is one visible step, not a larger plan.'
          : 'The system is waiting for first movement. Pick the smallest step that proves intent.';
  const completedPreviewLimit = 3;
  const hasHiddenCompletedGoals = completedGoals.length > completedPreviewLimit;
  const visibleCompletedGoals =
    showArchive || !hasHiddenCompletedGoals
      ? completedGoals
      : completedGoals.slice(0, completedPreviewLimit);

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
    <div className="ai-depth-stage mx-auto max-w-7xl space-y-6 overflow-x-clip">
      <section className="ai-atmosphere ai-momentum-mid overflow-hidden rounded-[2rem] border border-white/8 px-4 py-5 shadow-[0_26px_90px_rgba(2,6,23,0.28)] sm:px-6 lg:px-7">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <CircleDot className="h-3.5 w-3.5 text-cyan-300" />
              Trajectory system
            </div>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Meaningful paths, moving at the right pace.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {systemObservation}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <div className="ai-layer-soft rounded-2xl p-3">
              <div className="text-2xl font-semibold tabular-nums">{activeGoals.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">active</div>
            </div>
            <div className="ai-layer-soft rounded-2xl p-3">
              <div className="text-2xl font-semibold tabular-nums">{overallMomentum}%</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">momentum</div>
            </div>
            <div className="ai-layer-soft rounded-2xl p-3">
              <div className="text-2xl font-semibold tabular-nums">{completedGoals.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">resolved</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-full border border-white/8 bg-background/34 p-1">
            <SortButton
              active={sort === 'priority'}
              onClick={() => setSort('priority')}
            >
              Priority
            </SortButton>
            <SortButton
              active={sort === 'attention'}
              onClick={() => setSort('attention')}
            >
              Needs attention
            </SortButton>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              onClick={() => navigate('/app/goals/new')}
              variant="ghost"
              className="rounded-full border border-white/8 bg-background/28"
            >
              <Plus className="h-4 w-4" /> New path
            </Button>

            <Button
              onClick={() => navigate('/app/goals/ai')}
              className="rounded-full bg-foreground/92 text-background hover:bg-foreground"
            >
              <Sparkles className="h-4 w-4" /> Start with AI
            </Button>
          </div>
        </div>
      </section>

      <AIContextNudge />

      {!loading && goals.length === 0 && (
        <div className="ai-reactive-edge overflow-hidden rounded-[2rem] border border-dashed border-white/12 bg-background/36 p-8 text-center shadow-[0_20px_70px_rgba(2,6,23,0.18)] sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-400/10 text-2xl">
            <Brain className="h-7 w-7 text-cyan-300" />
          </div>
          <div className="mt-5">
            <div className="text-xl font-semibold">Choose your first trajectory</div>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Begyn becomes more useful once it can see what you are becoming.
              Start with one meaningful path.
            </p>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => navigate('/app/goals/ai')}
              className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 sm:w-auto"
            >
              <Sparkles className="h-4 w-4" /> Start with AI
            </Button>
            <Button
              onClick={() => navigate('/app/goals/new')}
              variant="ghost"
              className="w-full rounded-full border border-white/10 sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Manual path
            </Button>
          </div>
        </div>
      )}

      {!loading && 
      activeGoals.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3 px-1">
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
                Current trajectory
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The path with the strongest signal right now.
              </p>
            </div>
            <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          </div>

          {featuredGoal && (
            <GoalCard
              goal={featuredGoal}
              doneMap={done[featuredGoal.id]}
              overdueCount={overdueCountByGoal[featuredGoal.id] ?? 0}
              variant="featured"
              onEdit={() => setLocalModal(featuredGoal)}
              onDelete={() => handleDelete(featuredGoal.id)}
              onImprove={isPro ? () => setImprovingGoal(featuredGoal) : undefined}
            />
          )}

          {secondaryActiveGoals.length > 0 && (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.52fr)] lg:items-start">
              <div className="grid gap-3 sm:grid-cols-2">
                {paginatedSecondaryGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  doneMap={done[goal.id]}
                  overdueCount={overdueCountByGoal[goal.id] ?? 0}
                  variant="compact"
                  onEdit={() => setLocalModal(goal)}
                  onDelete={() => handleDelete(goal.id)}
                  onImprove={isPro ? () => setImprovingGoal(goal) : undefined}
                />
              ))}
              </div>

              <aside className="ai-layer-soft rounded-[1.5rem] p-4 lg:sticky lg:top-24">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                  Ambient intelligence
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {totalOverdue > 0
                    ? 'Refine the overdue paths before creating new ones. Smaller steps will restore flow faster.'
                    : 'Your active goals are clear enough to move. Keep the next action visible and low-friction.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (featuredGoal && isPro) setImprovingGoal(featuredGoal);
                    else navigate('/app/goals/ai');
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-background/42 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-background/70"
                >
                  <Brain className="h-3.5 w-3.5 text-cyan-300" />
                  {isPro ? 'Refine primary path' : 'Open AI planner'}
                </button>
              </aside>
            </div>
          )}

          {secondaryActiveGoals.length > SECONDARY_GOALS_PER_PAGE && (
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
        <div className="rounded-[1.75rem] border border-dashed border-emerald-400/20 bg-emerald-400/6 p-8 text-center">
          <Archive className="mx-auto h-8 w-8 text-emerald-300" />
          <div className="mt-3 text-lg font-semibold">All current goals completed</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Your finished goals are saved below. Start a new goal whenever you want to build fresh momentum.
          </p>
        </div>
      )}

      {!loading && completedGoals.length > 0 && (
        <section className="rounded-[1.75rem] border border-white/8 bg-background/24 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">Completed goals</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {completedGoals.length} finished path{completedGoals.length === 1 ? '' : 's'} saved quietly.
              </p>
            </div>
            {hasHiddenCompletedGoals && (
              <button
                type="button"
                onClick={() => setShowArchive((current) => !current)}
                className="flex shrink-0 items-center gap-2 rounded-full bg-background/42 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {showArchive ? 'Show fewer' : `Show all ${completedGoals.length}`}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showArchive ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCompletedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                doneMap={done[goal.id]}
                isCompleted
                variant="archive"
                onEdit={() => setLocalModal(goal)}
                onDelete={() => handleDelete(goal.id)}
              />
            ))}
          </div>
        </section>
      )}

      {localModal !== null && (
        <AddEditGoalModal
          initial={localModal}
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
