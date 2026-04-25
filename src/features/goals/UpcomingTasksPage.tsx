import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoalProgressState, useToggleGoalStepMutation } from '@/features/goals/goalStore';
import { useGoalsState } from './useGoalsQuery';
import type { UserGoal } from './goalTypes';
import type { UpcomingItem } from '@/features/dashboard/hooks/useGoalsDashboard';
import { getLocalDateKey } from '@/hooks/useTodayDate';

type JustCompletedItem = {
  key: string;
  goalId: string;
  goalTitle: string;
  goalEmoji: string;
  stepLabel: string;
};

function todayISO() {
  return getLocalDateKey();
}

function diffDays(isoA: string, isoB: string) {
  return Math.round(
    (new Date(isoB + 'T00:00:00').getTime() -
      new Date(isoA + 'T00:00:00').getTime()) /
      86400000,
  );
}

function getUpcomingItems(
  goals: UserGoal[],
  doneMap: Record<string, Record<string, boolean>>,
  horizonDays: number,
): UpcomingItem[] {
  const today = todayISO();
  const items: UpcomingItem[] = [];

  for (const goal of goals) {
    for (const step of goal.steps) {
      if (!step.idealFinish) continue;
      if (doneMap[goal.id]?.[step.id]) continue;
      const days = diffDays(today, step.idealFinish);
      if (days > horizonDays) continue;
      items.push({
        goalId: goal.id,
        goalTitle: goal.title,
        goalEmoji: goal.emoji,
        step,
        daysFromToday: days,
      });
    }
  }

  return items.sort((a, b) => a.daysFromToday - b.daysFromToday);
}

function groupItemsByGoal(items: UpcomingItem[]) {
  const map = new Map<string, UpcomingItem[]>();

  for (const item of items) {
    const existing = map.get(item.goalId) ?? [];
    existing.push(item);
    map.set(item.goalId, existing);
  }

  return Array.from(map.entries());
}

function UpcomingSection({
  title,
  subtitle,
  items,
  done,
  onToggle,
  defaultCollapsed = false,
}: {
  title: string;
  subtitle: string;
  items: UpcomingItem[];
  done: Record<string, Record<string, boolean>>;
  onToggle: (item: UpcomingItem) => void;
  defaultCollapsed?: boolean;
}) {
  const grouped = useMemo(() => groupItemsByGoal(items), [items]);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    setCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);

  if (grouped.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className="shrink-0 rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {collapsed ? `Show ${items.length}` : 'Hide'}
        </button>
      </div>

      {!collapsed && (
        <div className="grid gap-4 lg:grid-cols-2">
        {grouped.map(([goalId, arr]) => (
          <div key={goalId} className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium leading-snug">
                  {arr[0].goalEmoji} {arr[0].goalTitle}
                </div>
                <div className="text-xs text-muted-foreground">
                  {arr.length} step{arr.length === 1 ? '' : 's'} here
                </div>
              </div>
              <Link
                to={`/app/goals/${goalId}`}
                className="shrink-0 text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
              >
                Open
              </Link>
            </div>

            <div className="mt-3 space-y-2">
              {arr.slice(0, 6).map((it) => {
                const overdue = it.daysFromToday < 0;
                const label = overdue
                  ? `${Math.abs(it.daysFromToday)}d overdue`
                  : it.daysFromToday === 0
                    ? 'today'
                    : `in ${it.daysFromToday}d`;

                return (
                  <div
                    key={it.step.id}
                    className="rounded-lg border border-transparent p-2 -mx-2 sm:mx-0 sm:p-0"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <label className="flex min-w-0 cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={!!done[it.goalId]?.[it.step.id]}
                          onChange={() => onToggle(it)}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-snug">
                            {it.step.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            due {it.step.idealFinish}
                          </div>
                        </div>
                      </label>

                      <div
                        className={
                          'self-start rounded-full px-2 py-1 text-xs tabular-nums sm:shrink-0 ' +
                          (overdue
                            ? 'bg-destructive/15 text-destructive'
                            : it.daysFromToday === 0
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-muted text-muted-foreground')
                        }
                      >
                        {label}
                      </div>
                    </div>
                  </div>
                );
              })}

              {arr.length > 6 && (
                <div className="text-xs text-muted-foreground">
                  +{arr.length - 6} more…
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      )}
    </section>
  );
}

export function UpcomingTasksPage() {
  const { doneState: done, isGoalProgressLoading } = useGoalProgressState();
  const toggleGoalStepMutation = useToggleGoalStepMutation();
  const { goals, isGoalsLoading } = useGoalsState();
  const [horizonDays, setHorizonDays] = useState<7 | 14>(7);
  const [justCompleted, setJustCompleted] = useState<JustCompletedItem[]>([]);
  const completionTimersRef = useRef<Record<string, number>>({});
  const loading = isGoalsLoading || isGoalProgressLoading;

  const items = useMemo(
    () => getUpcomingItems(goals, done, horizonDays),
    [done, goals, horizonDays],
  );

  const overdueCount = useMemo(
    () => items.filter((item) => item.daysFromToday < 0).length,
    [items],
  );
  const overdueItems = useMemo(
    () => items.filter((item) => item.daysFromToday < 0),
    [items],
  );
  const dueTodayItems = useMemo(
    () => items.filter((item) => item.daysFromToday === 0),
    [items],
  );
  const futureItems = useMemo(
    () => items.filter((item) => item.daysFromToday > 0),
    [items],
  );

  useEffect(() => {
    return () => {
      Object.values(completionTimersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, []);

  function handleToggle(item: UpcomingItem) {
    const key = `${item.goalId}:${item.step.id}`;

    toggleGoalStepMutation.mutate({
      goalId: item.goalId,
      stepId: item.step.id,
    });

    setJustCompleted((current) =>
      [
        {
          key,
          goalId: item.goalId,
          goalTitle: item.goalTitle,
          goalEmoji: item.goalEmoji,
          stepLabel: item.step.label,
        },
        ...current.filter((entry) => entry.key !== key),
      ].slice(0, 3),
    );

    window.clearTimeout(completionTimersRef.current[key]);
    completionTimersRef.current[key] = window.setTimeout(() => {
      setJustCompleted((current) => current.filter((entry) => entry.key !== key));
      delete completionTimersRef.current[key];
    }, 2600);

    toast('Marked as done', {
      description: `${item.goalEmoji} ${item.goalTitle} — ${item.step.label}`,
      action: {
        label: 'Undo',
        onClick: () => {
          toggleGoalStepMutation.mutate({
            goalId: item.goalId,
            stepId: item.step.id,
          });
          window.clearTimeout(completionTimersRef.current[key]);
          delete completionTimersRef.current[key];
          setJustCompleted((current) => current.filter((entry) => entry.key !== key));
        },
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">📌 Upcoming</h2>
          <p className="text-sm text-muted-foreground">
            Overdue + due in the next {horizonDays} days across all goals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {([7, 14] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setHorizonDays(d)}
              className={
                'rounded-full border px-3 py-1 text-sm ' +
                (horizonDays === d
                  ? 'bg-foreground text-background'
                  : 'bg-transparent text-muted-foreground hover:text-foreground')
              }
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="text-sm text-muted-foreground">
          {loading
            ? 'Loading…'
            : items.length === 0
              ? 'Nothing due soon 🎉'
              : `${items.length} step${items.length === 1 ? '' : 's'} need attention · ${overdueCount} overdue`}
        </div>

        <div className="mt-4">
          {!loading && justCompleted.length > 0 && (
            <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Just completed
              </div>
              <div className="mt-2 space-y-1.5">
                {justCompleted.map((entry) => (
                  <div key={entry.key} className="text-sm">
                    <span className="font-medium text-foreground">
                      {entry.goalEmoji} {entry.stepLabel}
                    </span>
                    <span className="text-muted-foreground"> in {entry.goalTitle}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-sm text-muted-foreground">
              {goals.length === 0
                ? 'No goals yet — add some from the Goals tab.'
                : 'No steps with due dates in this window. Add due dates to your goal steps to see them here.'}
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse space-y-2 rounded-xl border p-3"
                >
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="space-y-6">
              <UpcomingSection
                title="Overdue"
                subtitle="These need attention first."
                items={overdueItems}
                done={done}
                onToggle={handleToggle}
              />

              <UpcomingSection
                title="Due today"
                subtitle="These are on the clock today."
                items={dueTodayItems}
                done={done}
                onToggle={handleToggle}
              />

              <UpcomingSection
                title="Coming up"
                subtitle={`Still within the next ${horizonDays} days, but not urgent yet.`}
                items={futureItems}
                done={done}
                onToggle={handleToggle}
                defaultCollapsed={overdueItems.length > 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
