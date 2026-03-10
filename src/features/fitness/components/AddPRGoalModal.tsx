import { useState } from "react";
import { X, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PR_SUGGESTIONS,
  CATEGORY_LABELS,
  UNIT_OPTIONS,
  type PRCategory,
  type MetricType,
  type PRGoal,
  slugify,
  fmtValue,
} from "@/features/fitness/fitnessStorage";

type Mode = "browse" | "custom";

interface Props {
  existingIds: Set<string>;
  onAdd: (goal: Omit<PRGoal, "history" | "createdAt">) => void;
  onClose: () => void;
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as PRCategory[];

export function AddPRGoalModal({ existingIds, onAdd, onClose }: Props) {
  const [mode,       setMode]       = useState<Mode>("browse");
  const [search,     setSearch]     = useState("");
  const [filterCat,  setFilterCat]  = useState<PRCategory | "all">("all");

  // Custom form state
  const [customLabel, setCustomLabel] = useState("");
  const [customUnit,  setCustomUnit]  = useState<MetricType>("kg");
  const [customGoal,  setCustomGoal]  = useState("");
  const [customGoalLabel, setCustomGoalLabel] = useState("");
  const [customCat,   setCustomCat]   = useState<PRCategory>("custom");

  const filtered = PR_SUGGESTIONS.filter((s) => {
    const matchesCat = filterCat === "all" || s.category === filterCat;
    const matchesSearch = s.label.toLowerCase().includes(search.toLowerCase());
    const notAdded = !existingIds.has(s.id);
    return matchesCat && matchesSearch && notAdded;
  });

  function handlePickSuggestion(s: typeof PR_SUGGESTIONS[number]) {
    onAdd({
      id:        s.id,
      label:     s.label,
      unit:      s.unit,
      goal:      s.defaultGoal,
      goalLabel: s.defaultGoalLabel,
      category:  s.category,
    });
  }

  function handleCustomSubmit() {
    const label = customLabel.trim();
    const goal  = Number(customGoal);
    if (!label || goal <= 0) return;
    const id = slugify(label) + "_" + Date.now();
    onAdd({
      id,
      label,
      unit:      customUnit,
      goal,
      goalLabel: customGoalLabel.trim() || fmtValue(goal, customUnit),
      category:  customCat,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border bg-background shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div>
            <h2 className="text-base font-semibold">Add PR Goal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pick from suggestions or create your own
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex gap-1 rounded-xl border bg-muted/30 p-1">
            {(["browse", "custom"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={[
                  "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {m === "browse" ? "Browse suggestions" : "Custom"}
              </button>
            ))}
          </div>
        </div>

        {/* Browse mode */}
        {mode === "browse" && (
          <>
            {/* Search + category filter */}
            <div className="px-5 pb-3 space-y-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border bg-background pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterCat("all")}
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
                    filterCat === "all"
                      ? "bg-foreground text-background border-foreground"
                      : "text-muted-foreground hover:text-foreground border-border",
                  ].join(" ")}
                >
                  All
                </button>
                {ALL_CATEGORIES.filter(c => c !== "custom").map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCat(cat)}
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
                      filterCat === cat
                        ? "bg-foreground text-background border-foreground"
                        : "text-muted-foreground hover:text-foreground border-border",
                    ].join(" ")}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions list */}
            <div className="overflow-y-auto px-5 pb-5 space-y-1.5">
              {filtered.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {existingIds.size > 0 && search === ""
                    ? "All suggestions in this category are already added."
                    : "No results — try the Custom tab to add your own."}
                </div>
              )}
              {filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handlePickSuggestion(s)}
                  className="w-full flex items-center justify-between rounded-xl border px-3.5 py-3 text-left hover:bg-muted/40 transition-colors group"
                >
                  <div>
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {CATEGORY_LABELS[s.category]} · Default goal: {s.defaultGoalLabel}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-3 transition-colors" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Custom mode */}
        {mode === "custom" && (
          <div className="overflow-y-auto px-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Exercise name *</label>
              <input
                type="text"
                placeholder="e.g. Romanian Deadlift"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Unit *</label>
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as MetricType)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {UNIT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <select
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value as PRCategory)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Goal value *</label>
                <input
                  type="number"
                  min={0}
                  placeholder={customUnit === "seconds" ? "e.g. 300" : "e.g. 100"}
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Goal label (optional)</label>
                <input
                  type="text"
                  placeholder={customUnit === "seconds" ? "e.g. Sub 5:00" : "e.g. 100 kg"}
                  value={customGoalLabel}
                  onChange={(e) => setCustomGoalLabel(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {customUnit === "seconds" && (
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/30 px-3 py-2">
                Enter time in seconds — e.g. 75 for 1:15, 300 for 5:00, 3600 for 1:00:00
              </p>
            )}

            <Button
              className="w-full"
              disabled={!customLabel.trim() || Number(customGoal) <= 0}
              onClick={handleCustomSubmit}
            >
              <Plus className="h-4 w-4 mr-2" /> Add PR Goal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}