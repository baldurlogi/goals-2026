import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Pencil, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGoalsStore } from "@/features/goals/goalStoreContext";
import { StepsCard } from "@/features/goals/components/StepsCard";
import { AddEditGoalModal } from "@/features/goals/components/AddEditGoalModal";
import { ImproveGoalModal } from "@/features/goals/components/ImproveGoalModal";
import { UpgradeBanner } from "@/features/subscription/UpgradeBanner";
import { useTier, tierMeets } from "@/features/subscription/useTier";
import { loadUserGoals, saveUserGoal } from "@/features/goals/userGoalStorage";
import type { UserGoal, UserGoalStep } from "@/features/goals/goalTypes";

// Convert UserGoalStep → GoalStep shape that StepsCard expects
function toGoalStep(s: UserGoalStep) {
  return {
    id: s.id,
    label: s.label,
    notes: s.notes || undefined,
    idealFinish: s.idealFinish ?? undefined,
    estimatedTime: s.estimatedTime || undefined,
  };
}

export function UserGoalPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const { state, dispatch } = useGoalsStore();
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [improving, setImproving] = useState(false);
  const tier = useTier();
  const isPro = tierMeets(tier, "pro");

  useEffect(() => {
    let cancelled = false;
    loadUserGoals().then((goals) => {
      if (!cancelled) {
        setGoal(goals.find((g) => g.id === goalId) ?? null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [goalId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="space-y-4 text-center py-16">
        <div className="text-4xl">🔍</div>
        <div className="font-semibold">Goal not found</div>
        <Button asChild variant="secondary">
          <Link to="/app/goals">Back to goals</Link>
        </Button>
      </div>
    );
  }

  const doneMap = state.done[goal.id] ?? {};
  const total = goal.steps.length;
  const doneCount = goal.steps.filter((s) => doneMap[s.id]).length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const PRIORITY_COLOR: Record<string, string> = {
    high: "text-rose-400", medium: "text-amber-400", low: "text-emerald-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            <Link to="/app/goals" className="underline">Goals</Link> / {goal.title}
          </div>
          <h1 className="text-2xl font-semibold">{goal.emoji} {goal.title}</h1>
          {goal.subtitle && (
            <p className="text-muted-foreground">{goal.subtitle}</p>
          )}
          <div className="text-sm text-muted-foreground">
            {doneCount}/{total} steps · Priority:{" "}
            <span className={`capitalize font-medium ${PRIORITY_COLOR[goal.priority]}`}>
              {goal.priority}
            </span>
          </div>
          <div className="mt-3 max-w-xl">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{doneCount}/{total} steps</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="mt-2 h-2" />
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end shrink-0">
          <div className="flex gap-2">
            {isPro && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImproving(true)}
                className="gap-2 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:text-violet-400"
              >
                <Sparkles className="h-3.5 w-3.5" /> Improve with AI
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
              <Pencil className="h-3.5 w-3.5" /> Edit goal
            </Button>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => dispatch({ type: "resetGoal", goalId: goal.id })}
          >
            Reset steps
          </Button>
        </div>
      </div>

      {/* Upgrade banner — shown only for free tier */}
      {!isPro && (
        <UpgradeBanner feature="AI goal optimization" requiredTier="pro" />
      )}

      {/* Steps */}
      {goal.steps.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
          <div className="text-3xl">📋</div>
          <div>
            <div className="font-medium">No steps yet</div>
            <p className="text-sm text-muted-foreground mt-1">
              Edit this goal to add steps and track your progress.
            </p>
          </div>
          <Button variant="outline" onClick={() => setEditing(true)}>Add steps</Button>
        </div>
      ) : (
        <StepsCard
          goalId={goal.id}
          goalTitle={goal.title}
          steps={goal.steps.map(toGoalStep)}
          doneMap={doneMap}
          onToggle={(stepId) => dispatch({ type: "toggleStep", goalId: goal.id, stepId })}
          heightClassName="h-[600px]"
        />
      )}

      {/* Edit modal */}
      {editing && (
        <AddEditGoalModal
          initial={goal}
          onSave={(updated) => {
            setGoal(updated);
            saveUserGoal(updated);
            setEditing(false);
            toast.success("Goal updated");
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {/* Improve modal */}
      {improving && (
        <ImproveGoalModal
          goal={goal}
          onApply={(newSteps) => {
            const updated: UserGoal = {
              ...goal,
              steps: newSteps,
              updatedAt: new Date().toISOString(),
            };
            setGoal(updated);
            saveUserGoal(updated);
            setImproving(false);
            toast.success("Goal steps improved ✨");
          }}
          onClose={() => setImproving(false)}
        />
      )}
    </div>
  );
}