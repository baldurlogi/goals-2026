import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useGoalsStore } from "./goalStore";
import { goalsRegistry } from "./registry";
import { getUpcomingSteps } from "./goalUtils";

export function UpcomingTasksPage() {
  const { state, dispatch } = useGoalsStore();
  const [horizonDays, setHorizonDays] = useState<7 | 14>(14);

  const items = useMemo(
    () => getUpcomingSteps(goalsRegistry, state.done, horizonDays),
    [state.done, horizonDays]
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
          <button
            type="button"
            onClick={() => setHorizonDays(7)}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (horizonDays === 7
                ? "bg-foreground text-background"
                : "bg-transparent text-muted-foreground hover:text-foreground")
            }
          >
            7 days
          </button>
          <button
            type="button"
            onClick={() => setHorizonDays(14)}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (horizonDays === 14
                ? "bg-foreground text-background"
                : "bg-transparent text-muted-foreground hover:text-foreground")
            }
          >
            14 days
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {items.length === 0
              ? "Nothing due soon 🎉"
              : `${items.length} step${items.length === 1 ? "" : "s"} • ${overdueCount} overdue`}
          </div>
        </div>

        <div className="mt-4">
          {grouped.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Add `idealFinish` dates like <span className="font-medium">2026-02-20</span> to your steps to have them
              appear here.
            </div>
          ) : (
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
                      to={`/goals/${goalId}`}
                      className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
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
                        ? "today"
                        : `in ${it.daysFromToday}d`;

                      return (
                        <div
                          key={it.step.id}
                          className="flex items-start justify-between gap-3"
                        >
                          <label className="flex min-w-0 items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={false}
                                onChange={() => {
                                dispatch({ type: "toggleStep", goalId: it.goalId, stepId: it.step.id });

                                toast("Marked as done", {
                                    description: `${it.goalEmoji} ${it.goalTitle} — ${it.step.label}`,
                                    action: {
                                    label: "Undo",
                                    onClick: () =>
                                        dispatch({ type: "toggleStep", goalId: it.goalId, stepId: it.step.id }),
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
                              "shrink-0 rounded-full px-2 py-1 text-xs tabular-nums " +
                              (overdue
                                ? "bg-destructive/15 text-destructive"
                                : "bg-muted text-muted-foreground")
                            }
                          >
                            {label}
                          </div>
                        </div>
                      );
                    })}

                    {arr.length > 6 ? (
                      <div className="text-xs text-muted-foreground">
                        +{arr.length - 6} more…
                      </div>
                    ) : null}
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
