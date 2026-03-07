import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoalsStore } from '@/features/goals/goalStoreContext';
import { loadUserGoals, seedUserGoals } from './userGoalStorage';
import type { UserGoal } from './goalTypes';
import type { UpcomingItem } from '@/features/dashboard/hooks/useGoalsDashboard';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
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

export function UpcomingTasksPage() {
  const { state, dispatch } = useGoalsStore();
  const [goals, setGoals] = useState<UserGoal[]>(() => seedUserGoals());
  const [loading, setLoading] = useState(goals.length === 0);
  const [horizonDays, setHorizonDays] = useState<7 | 14>(14);

  useEffect(() => {
    let cancelled = false;
    loadUserGoals().then((g) => {
      if (!cancelled) {
        setGoals(g);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(
    () => getUpcomingItems(goals, state.done, horizonDays),
    [goals, state.done, horizonDays],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const arr = map.get(it.goalId) ?? [];
      arr.push(it);
      map.set(it.goalId, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  const overdueCount = items.filter((i) => i.daysFromToday < 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
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
        {/* Summary row */}
        <div className="text-sm text-muted-foreground">
          {loading
            ? 'Loading…'
            : items.length === 0
              ? 'Nothing due soon 🎉'
              : `${items.length} step${items.length === 1 ? '' : 's'} · ${overdueCount} overdue`}
        </div>

        <div className="mt-4">
          {/* Empty state */}
          {!loading && grouped.length === 0 && (
            <div className="text-sm text-muted-foreground">
              {goals.length === 0
                ? 'No goals yet — add some from the Goals tab.'
                : 'No steps with due dates in this window. Add due dates to your goal steps to see them here.'}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border p-3 space-y-2 animate-pulse"
                >
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {/* Grouped goal cards */}
          {!loading && grouped.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {grouped.map(([goalId, arr]) => (
                <div key={goalId} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {arr[0].goalEmoji} {arr[0].goalTitle}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {arr.length} due
                      </div>
                    </div>
                    <Link
                      to={`/app/goals/${goalId}`}
                      className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground shrink-0"
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
                          className="flex items-start justify-between gap-3"
                        >
                          <label className="flex min-w-0 items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={!!state.done[it.goalId]?.[it.step.id]}
                              onChange={() => {
                                dispatch({
                                  type: 'toggleStep',
                                  goalId: it.goalId,
                                  stepId: it.step.id,
                                });
                                toast('Marked as done', {
                                  description: `${it.goalEmoji} ${it.goalTitle} — ${it.step.label}`,
                                  action: {
                                    label: 'Undo',
                                    onClick: () =>
                                      dispatch({
                                        type: 'toggleStep',
                                        goalId: it.goalId,
                                        stepId: it.step.id,
                                      }),
                                  },
                                });
                              }}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {it.step.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                due {it.step.idealFinish}
                              </div>
                            </div>
                          </label>

                          <div
                            className={
                              'shrink-0 rounded-full px-2 py-1 text-xs tabular-nums ' +
                              (overdue
                                ? 'bg-destructive/15 text-destructive'
                                : 'bg-muted text-muted-foreground')
                            }
                          >
                            {label}
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
        </div>
      </div>
    </div>
  );
}
