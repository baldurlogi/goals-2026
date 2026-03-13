import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddPRGoalModal } from "@/features/fitness/components/AddPRGoalModal";
import { PRCard } from "@/features/fitness/components/PRCard";
import { WeeklySplitCard } from "@/features/fitness/components/WeeklySplitCard";
import { CATEGORY_LABELS, FITNESS_CHANGED_EVENT } from "./constants";
import {
  addPRGoal,
  deletePREntry,
  deletePRGoal,
  loadPRGoals,
  logPREntry,
  readPRCache,
  updatePRGoal,
} from "./prGoalStorage";
import { type PRCategory, type PRGoal } from "./types";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as PRCategory[];

function PRCardPlaceholder() {
  return (
    <div className="min-h-[260px] animate-pulse rounded-2xl border bg-card p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          <div className="h-8 w-8 rounded bg-muted" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-3 w-14 rounded bg-muted" />
            <div className="h-3 w-10 rounded bg-muted" />
          </div>
          <div className="h-2 w-full rounded-full bg-muted" />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-20 rounded bg-muted" />
          <div className="h-8 w-20 rounded bg-muted" />
        </div>

        <div className="h-24 rounded-xl bg-muted/60" />
      </div>
    </div>
  );
}

export function FitnessPage() {
  const [goals, setGoals] = useState<PRGoal[]>(() => readPRCache());
  const [initialSyncDone, setInitialSyncDone] = useState(
    () => readPRCache().length > 0,
  );
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState<PRCategory | "all">("all");

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const fresh = await loadPRGoals();
        if (!cancelled) setGoals(fresh);
      } finally {
        if (!cancelled) setInitialSyncDone(true);
      }
    }

    void sync();

    const handleSync = () => {
      void sync();
    };

    window.addEventListener(FITNESS_CHANGED_EVENT, handleSync);

    return () => {
      cancelled = true;
      window.removeEventListener(FITNESS_CHANGED_EVENT, handleSync);
    };
  }, []);

  async function refreshGoals() {
    setGoals(await loadPRGoals());
  }

  async function handleAdd(goal: Omit<PRGoal, "history" | "createdAt">) {
    await addPRGoal(goal);
    await refreshGoals();
    setShowAdd(false);
    toast.success(`${goal.label} added!`);
  }

  async function handleLog(id: string, value: number, notes?: string) {
    await logPREntry(id, value, notes);
    await refreshGoals();
    toast.success("PR logged! 💪");
  }

  async function handleGoalUpdate(id: string, goal: number) {
    const existing = goals.find((item) => item.id === id);

    await updatePRGoal(id, {
      goal,
      goalLabel: existing ? `${goal} ${existing.unit}` : String(goal),
    });

    await refreshGoals();
    toast.success("Goal updated");
  }

  async function handleDeleteEntry(id: string, index: number) {
    await deletePREntry(id, index);
    await refreshGoals();
    toast.success("Entry deleted");
  }

  async function handleRemoveGoal(id: string) {
    await deletePRGoal(id);
    await refreshGoals();
    toast.success("PR goal removed");
  }

  const existingIds = useMemo(() => new Set(goals.map((g) => g.id)), [goals]);

  const visibleGoals = useMemo(
    () =>
      filterCat === "all"
        ? goals
        : goals.filter((goal) => goal.category === filterCat),
    [filterCat, goals],
  );

  const usedCategories = useMemo(
    () =>
      CATEGORIES.filter((cat) =>
        goals.some((goal) => goal.category === cat),
      ),
    [goals],
  );

  const showInitialPlaceholder = !initialSyncDone && goals.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Dumbbell className="h-5 w-5 text-violet-500" />
        <div>
          <h1 className="text-xl font-semibold">Fitness</h1>
          <p className="text-sm text-muted-foreground">
            Weekly plan, workout streak, and personal records.
          </p>
        </div>
      </div>

      <WeeklySplitCard />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Personal Records
          </h2>

          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add PR Goal
          </Button>
        </div>

        {usedCategories.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterCat("all")}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filterCat === "all"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              All ({goals.length})
            </button>

            {usedCategories.map((cat) => {
              const count = goals.filter((goal) => goal.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    filterCat === cat
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {CATEGORY_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>
        )}

        {showInitialPlaceholder ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <PRCardPlaceholder key={i} />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              No PR goals yet
            </p>
            <p className="mb-4 mt-1 text-xs text-muted-foreground/60">
              Add your first goal — pick from suggestions or create your own.
            </p>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add PR Goal
            </Button>
          </div>
        ) : visibleGoals.length > 0 ? (
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
        ) : null}
      </div>

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