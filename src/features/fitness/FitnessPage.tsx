import { useEffect, useState } from "react";
import { Dumbbell, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  loadPRGoals,
  addPRGoal,
  updatePRGoal,
  deletePRGoal,
  logPREntry,
  deletePREntry,
  readPRCache,
  FITNESS_CHANGED_EVENT,
  CATEGORY_LABELS,
  type PRGoal,
  type PRCategory,
} from "@/features/fitness/fitnessStorage";
import { WeeklySplitCard } from "@/features/fitness/components/WeeklySplitCard";
import { PRCard } from "@/features/fitness/components/PRCard";
import { AddPRGoalModal } from "@/features/fitness/components/AddPRGoalModal";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as PRCategory[];

export function FitnessPage() {
  const [goals,      setGoals]      = useState<PRGoal[]>(() => readPRCache());
  const [showAdd,    setShowAdd]    = useState(false);
  const [filterCat,  setFilterCat]  = useState<PRCategory | "all">("all");

  useEffect(() => {
    const sync = async () => setGoals(await loadPRGoals());
    sync();
    window.addEventListener(FITNESS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(FITNESS_CHANGED_EVENT, sync);
  }, []);

  async function handleAdd(goal: Omit<PRGoal, "history" | "createdAt">) {
    await addPRGoal(goal);
    setGoals(await loadPRGoals());
    setShowAdd(false);
    toast.success(`${goal.label} added!`);
  }

  async function handleLog(id: string, value: number, notes?: string) {
    await logPREntry(id, value, notes);
    setGoals(await loadPRGoals());
    toast.success("PR logged! 💪");
  }

  async function handleGoalUpdate(id: string, goal: number) {
    await updatePRGoal(id, { goal, goalLabel: String(goal) });
    setGoals(await loadPRGoals());
    toast.success("Goal updated");
  }

  async function handleDeleteEntry(id: string, index: number) {
    await deletePREntry(id, index);
    setGoals(await loadPRGoals());
    toast.success("Entry deleted");
  }

  async function handleRemoveGoal(id: string) {
    await deletePRGoal(id);
    setGoals(await loadPRGoals());
    toast.success("PR goal removed");
  }

  const existingIds = new Set(goals.map((g) => g.id));

  const visibleGoals = filterCat === "all"
    ? goals
    : goals.filter((g) => g.category === filterCat);

  const usedCategories = CATEGORIES.filter((c) => goals.some((g) => g.category === c));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Dumbbell className="h-5 w-5 text-violet-500" />
        <div>
          <h1 className="text-xl font-semibold">Fitness</h1>
          <p className="text-sm text-muted-foreground">
            Weekly plan, workout streak, and personal records.
          </p>
        </div>
      </div>

      {/* Weekly Split */}
      <WeeklySplitCard />

      {/* PR section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Personal Records
          </h2>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" /> Add PR Goal
          </Button>
        </div>

        {/* Category filter — only show if user has goals in multiple categories */}
        {usedCategories.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterCat("all")}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                filterCat === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "text-muted-foreground hover:text-foreground border-border",
              ].join(" ")}
            >
              All ({goals.length})
            </button>
            {usedCategories.map((cat) => {
              const count = goals.filter((g) => g.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    filterCat === cat
                      ? "bg-foreground text-background border-foreground"
                      : "text-muted-foreground hover:text-foreground border-border",
                  ].join(" ")}
                >
                  {CATEGORY_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No PR goals yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
              Add your first goal — pick from suggestions or create your own.
            </p>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add PR Goal
            </Button>
          </div>
        )}

        {/* PR grid */}
        {visibleGoals.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleGoals.map((goal) => (
              <PRCard
                key={goal.id}
                goal={goal}
                onLog={handleLog}
                onGoalUpdate={handleGoalUpdate}
                onDelete={handleDeleteEntry}
                onRemove={handleRemoveGoal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add PR Goal modal */}
      {showAdd && (
        <AddPRGoalModal
          existingIds={existingIds}
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}