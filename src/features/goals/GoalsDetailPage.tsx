import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { goalsRegistry } from "./registry";
import { getGoalProgress } from "./goalUtils";
import { StepChecklist } from "./components/StepChecklist";
import { useGoalsStore } from "./goalStore";
import { Progress } from "@/components/ui/progress";


export function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const { state, dispatch } = useGoalsStore();

  const goal = useMemo(
    () => goalsRegistry.find((g) => g.id === goalId),
    [goalId]
  );

  if (!goal) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <p className="text-muted-foreground">Goal not found.</p>
        <Link to="/daily-plan/goals" className="underline">Goals</Link>
      </div>
    );
  }

  const doneMap = goalId ? state.done[goalId] : undefined;
  const { pct, doneCount, total } = getGoalProgress(goal, doneMap);

  const timeline = [...goal.steps].sort((a, b) =>
    String(a.idealFinish ?? "").localeCompare(String(b.idealFinish ?? ""))
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">
              <Link to="/daily-plan/goals" className="underline">Goals List</Link>
              {" / "}
              <span>Goals</span>
            </div>
            <h1 className="text-2xl font-semibold">
              {goal.emoji} {goal.title}
            </h1>
            <p className="text-muted-foreground">{goal.subtitle}</p>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">Priority</div>
            <div className="font-medium capitalize">{goal.priority}</div>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-xl border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium">Progress</div>
            <div className="text-sm text-muted-foreground">
              {pct}% • {doneCount}/{total}
            </div>
          </div>

          <Progress value={pct} className="h-2" />
        </div>

        {/* Full checklist */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Steps</h2>
          <StepChecklist
            steps={goal.steps}
            doneMap={doneMap}
            onToggle={(stepId) =>
              dispatch({ type: "toggleStep", goalId: goal.id, stepId })
            }
          />
        </section>

        {/* Timeline */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <div className="space-y-2">
            {timeline.map((s) => (
              <div key={s.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.idealFinish ?? "—"}
                  </div>
                </div>

                {s.notes ? (
                  <div className="text-sm text-muted-foreground mt-1">{s.notes}</div>
                ) : null}

                {s.links?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {s.links.map((href) => (
                      <a
                        key={href}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline text-muted-foreground hover:text-foreground"
                      >
                        {href.replace(/^https?:\/\//, "")}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
