import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Pencil, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGoalProgressState, useResetGoalProgressMutation, useToggleGoalStepMutation } from '@/features/goals/goalStore';
import { StepsCard } from '@/features/goals/components/StepsCard';
import { AddEditGoalModal } from '@/features/goals/components/AddEditGoalModal';
import { ImproveGoalModal } from '@/features/goals/components/ImproveGoalModal';
import { UpgradeBanner } from '@/features/subscription/UpgradeBanner';
import { useTier, tierMeets } from '@/features/subscription/useTier';
import { useAuth } from '@/features/auth/authContext';
import { GoalRemotePersistenceError } from '@/features/goals/userGoalStorage';
import { useGoalsState, useSaveGoalMutation } from '@/features/goals/useGoalsQuery';
import type { UserGoal, UserGoalStep } from '@/features/goals/goalTypes';
import type { GoalPersistenceStatus } from '@/features/goals/userGoalStorage';
import { getLocalDateKey } from '@/hooks/useTodayDate';
import { captureOnce } from '@/lib/analytics';

const AI_SIGNALS_CACHE_KEY = 'cache:ai-signals:v1';

function clearAISignalsCache() {
  try {
    localStorage.removeItem(AI_SIGNALS_CACHE_KEY);
  } catch {
    // ignore
  }
}

function lastSessionKey(userId: string) {
  return `cache:ai-coach:last-session:v2:${userId}`;
}

function writeLastSession(
  userId: string | null,
  goalId: string,
  goalTitle: string,
  stepLabel: string,
) {
  if (!userId) return;

  try {
    localStorage.setItem(
      lastSessionKey(userId),
      JSON.stringify({
        date: getLocalDateKey(),
        goalId,
        goalTitle,
        stepLabel,
      }),
    );
  } catch {
    // ignore
  }
}

// Convert UserGoalStep → GoalStep shape that StepsCard expects
function toGoalStep(s: UserGoalStep) {
  return {
    id: s.id,
    label: s.label,
    notes: s.notes || undefined,
    idealFinish: s.idealFinish ?? undefined,
    estimatedTime: s.estimatedTime || undefined,
    links: s.links,
    sortOrder: s.sortOrder,
  };
}

export function UserGoalPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const { doneState, isGoalProgressLoading } = useGoalProgressState();
  const toggleGoalStepMutation = useToggleGoalStepMutation();
  const resetGoalProgressMutation = useResetGoalProgressMutation();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { goals, isGoalsLoading: loading } = useGoalsState();
  const saveGoalMutation = useSaveGoalMutation();
  const [editing, setEditing] = useState(false);
  const [improving, setImproving] = useState(false);
  const tier = useTier();
  const isPro = tierMeets(tier, 'pro');

  const goal = useMemo(() => goals.find((item: UserGoal) => item.id === goalId) ?? null, [goalId, goals]);

  if (loading || isGoalProgressLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="space-y-4 py-16 text-center">
        <div className="text-4xl">🔍</div>
        <div className="font-semibold">Page not found</div>
        <Button asChild variant="secondary">
          <Link to="/app/goals">Go back</Link>
        </Button>
      </div>
    );
  }

  const activeGoal = goal;

  const doneMap = doneState[activeGoal.id] ?? {};
  const total = activeGoal.steps.length;
  const doneCount = activeGoal.steps.filter((s: UserGoalStep) => doneMap[s.id]).length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const PRIORITY_COLOR: Record<string, string> = {
    high: 'text-rose-400',
    medium: 'text-amber-400',
    low: 'text-emerald-400',
  };

  function handleToggleStep(stepId: string) {
    const wasDone = !!doneMap[stepId];
    const hadCompletedAnyStep = Object.values(doneState).some((goalDone: Record<string, boolean>) =>
      Object.values(goalDone).some(Boolean),
    );

    void toggleGoalStepMutation.mutate({ goalId: activeGoal.id, stepId });
    clearAISignalsCache();

    if (!wasDone && !hadCompletedAnyStep) {
      captureOnce('first_step_completed', userId, {
        goal_id: activeGoal.id,
        goal_title: activeGoal.title,
        step_id: stepId,
        total_steps: total,
        is_first_step: true,
        source: 'user_goal_page',
        route: window.location.pathname,
      });
    }

    if (!wasDone) {
      captureOnce('first_step_completed', userId, {
        total_steps: total,
      });

      const nextDoneCount = doneCount + 1;
      const step = activeGoal.steps.find((s: UserGoalStep) => s.id === stepId);
      if (step) writeLastSession(userId, activeGoal.id, activeGoal.title, step.label);

      toast.success(`1 step closer to ${activeGoal.title} 🎯`, {
        description: `${nextDoneCount}/${total} steps complete`,
      });
    }
  }

  const goalProgressIsPending =
    toggleGoalStepMutation.isPending || resetGoalProgressMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-sm text-muted-foreground">
            <Link to="/app/goals" className="underline">
              Goals
            </Link>{' '}
            / {activeGoal.title}
          </div>
          <h1 className="text-2xl font-semibold">
            {activeGoal.emoji} {activeGoal.title}
          </h1>
          {activeGoal.subtitle && (
            <p className="max-w-2xl pr-0 text-sm leading-relaxed text-muted-foreground sm:text-base lg:pr-6">
              {activeGoal.subtitle}
            </p>
          )}
          <div className="text-sm text-muted-foreground">
            {doneCount}/{total} steps · Priority:{' '}
            <span
              className={`capitalize font-medium ${PRIORITY_COLOR[activeGoal.priority]}`}
            >
              {activeGoal.priority}
            </span>
          </div>
          <div className="mt-4 max-w-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {doneCount}/{total} steps
              </span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 lg:items-end">
          <div className="flex flex-col gap-2 sm:flex-row">
            {isPro && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImproving(true)}
                className="w-full gap-2 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:text-violet-400 sm:w-auto"
              >
                <Sparkles className="h-3.5 w-3.5" /> Improve with AI
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="w-full gap-2 sm:w-auto"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit goal
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              void resetGoalProgressMutation.mutate({ goalId: activeGoal.id });
              clearAISignalsCache();
            }}
          >
            Reset steps
          </Button>
        </div>
      </div>

      {!isPro && (
        <UpgradeBanner feature="AI goal optimization" requiredTier="pro" />
      )}

      {activeGoal.steps.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-dashed p-10 text-center">
          <div className="text-3xl">📋</div>
          <div>
            <div className="font-medium">No steps yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit this goal to add steps and track your progress.
            </p>
          </div>
          <Button variant="outline" onClick={() => setEditing(true)}>
            Add steps
          </Button>
        </div>
      ) : (
        <StepsCard
          goalId={activeGoal.id}
          goalTitle={activeGoal.title}
          steps={activeGoal.steps.map(toGoalStep)}
          doneMap={doneMap}
          onToggle={handleToggleStep}
          disabled={goalProgressIsPending}
          maxHeightClassName="max-h-none md:max-h-[560px] lg:max-h-[640px]"
        />
      )}

      {editing && (
        <AddEditGoalModal
          initial={activeGoal}
          onSave={(updated) => {
            clearAISignalsCache();
            void saveGoalMutation.mutateAsync(updated).then(() => {
              setEditing(false);
            });
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {improving && (
        <ImproveGoalModal
          goal={activeGoal}
          onApply={(newSteps) => {
            const updated: UserGoal = {
              ...activeGoal,
              steps: newSteps,
              updatedAt: getLocalDateKey(),
            };
            clearAISignalsCache();
            setImproving(false);

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
          onClose={() => setImproving(false)}
        />
      )}
    </div>
  );
}
