import { useMemo, useState } from "react";
import { X, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_LABELS, PR_SUGGESTIONS, UNIT_OPTIONS } from "../constants";
import { fmtValue, slugify } from "../selectors";
import { type MetricType, type PRCategory, type PRGoal } from "../types";

type Mode = "browse" | "custom";

interface Props {
  existingIds: Set<string>;
  onAdd: (goal: Omit<PRGoal, "history" | "createdAt">) => void;
  onClose: () => void;
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as PRCategory[];

export function AddPRGoalModal({ existingIds, onAdd, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("browse");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<PRCategory | "all">("all");

  const [customLabel, setCustomLabel] = useState("");
  const [customUnit, setCustomUnit] = useState<MetricType>("kg");
  const [customGoal, setCustomGoal] = useState("");
  const [customGoalLabel, setCustomGoalLabel] = useState("");
  const [customCat, setCustomCat] = useState<PRCategory>("custom");

  const filtered = useMemo(() => {
    return PR_SUGGESTIONS.filter((suggestion) => {
      const matchesCat =
        filterCat === "all" || suggestion.category === filterCat;
      const matchesSearch = suggestion.label
        .toLowerCase()
        .includes(search.toLowerCase());
      const notAdded = !existingIds.has(suggestion.id);

      return matchesCat && matchesSearch && notAdded;
    });
  }, [existingIds, filterCat, search]);

  function handlePickSuggestion(
    suggestion: (typeof PR_SUGGESTIONS)[number],
  ) {
    onAdd({
      id: suggestion.id,
      label: suggestion.label,
      unit: suggestion.unit,
      goal: suggestion.defaultGoal,
      goalLabel: suggestion.defaultGoalLabel,
      category: suggestion.category,
    });
  }

  function handleCustomSubmit() {
    const label = customLabel.trim();
    const goal = Number(customGoal);

    if (!label || goal <= 0) return;

    const id = `${slugify(label)}_${Date.now()}`;

    onAdd({
      id,
      label,
      unit: customUnit,
      goal,
      goalLabel: customGoalLabel.trim() || fmtValue(goal, customUnit),
      category: customCat,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border bg-background shadow-xl">
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
          <div>
            <h2 className="text-base font-semibold">Add PR Goal</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pick from suggestions or create your own
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 border-b px-5 pb-3">
          <button
            type="button"
            onClick={() => setMode("browse")}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              mode === "browse"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Suggestions
          </button>

          <button
            type="button"
            onClick={() => setMode("custom")}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              mode === "custom"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Custom
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {mode === "browse" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search lifts, movements, runs..."
                  className="w-full bg-background py-2 pl-9 pr-3 text-sm"
                />
              </div>

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
                  All
                </button>

                {ALL_CATEGORIES.map((cat) => (
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
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-8 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    No matching suggestions
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Try another search or create a custom PR goal.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handlePickSuggestion(suggestion)}
                      className="flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {suggestion.label}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {CATEGORY_LABELS[suggestion.category].split(" ")[0]}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Goal: {suggestion.defaultGoalLabel}
                        </p>
                      </div>

                      <span className="ml-3 shrink-0 rounded-full bg-violet-500/10 p-2 text-violet-400">
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Label
                </label>
                <Input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Weighted Pull-up"
                  className="w-full bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Unit
                  </label>
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value as MetricType)}
                    className="w-full bg-background px-3 py-2 text-sm"
                  >
                    {UNIT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Category
                  </label>
                  <select
                    value={customCat}
                    onChange={(e) => setCustomCat(e.target.value as PRCategory)}
                    className="w-full bg-background px-3 py-2 text-sm"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Goal value
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Goal label (optional)
                  </label>
                  <Input
                    value={customGoalLabel}
                    onChange={(e) => setCustomGoalLabel(e.target.value)}
                    placeholder={`Defaults to ${customGoal ? fmtValue(Number(customGoal), customUnit) : "formatted value"}`}
                    className="w-full bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleCustomSubmit}
                disabled={!customLabel.trim() || Number(customGoal) <= 0}
              >
                Create custom PR goal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}