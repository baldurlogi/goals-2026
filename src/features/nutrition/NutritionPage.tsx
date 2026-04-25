import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Trash2, BookMarked, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  getTargets,
  NUTRITION_PHASE_OPTIONS,
  normalizeNutritionGoalFocuses,
  type NutritionPhase,
} from "./nutritionData";
import { MacroRow } from "./components/MacroRow";
import {
  loadNutritionLog,
  loadPhase,
  loadSavedMeals,
  savePhase,
  saveNewMeal,
  updateSavedMeal,
  deleteSavedMeal,
  logSavedMeal,
  addCustomEntry,
  removeCustomEntry,
  getLoggedMacros,
  type MealCategory,
  type SavedMeal,
  type CustomEntry,
  type NutritionLog,
} from "./nutritionStorage";
import type { Macros } from "./nutritionTypes";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { useProfile } from "@/features/onboarding/useProfile";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeNumericInput(value: string) {
  if (!value) return "";
  return /^\d*(?:\.\d{0,1})?$/.test(value) ? value : null;
}

function MacroInputRow({
  label, value, unit, onChange,
}: {
  label: string; value: string; unit: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const next = sanitizeNumericInput(e.target.value.trim());
            if (next !== null) onChange(next);
          }}
          className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="0"
          aria-label={`${label} in ${unit}`}
        />
        <span className="shrink-0 text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function macroBadge(m: Macros) {
  return `${m.cal} kcal · ${m.protein}g P · ${m.carbs}g C · ${m.fat}g F`;
}

const MEAL_CATEGORY_OPTIONS: Array<{ value: MealCategory; label: string }> = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "other", label: "Other" },
];

function getMealCategoryLabel(category: MealCategory) {
  return (
    MEAL_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ??
    "Other"
  );
}

type SavedMealsFilter = "all" | MealCategory;

// ── Manual entry form ─────────────────────────────────────────────────────────

function ManualEntryForm({
  initialMeal,
  onAdd,
  onSaveAndAdd,
  onUpdate,
  onCancelEdit,
}: {
  initialMeal?: SavedMeal | null;
  onAdd: (name: string, macros: Macros) => Promise<boolean>;
  onSaveAndAdd: (
    name: string,
    macros: Macros,
    emoji: string,
    category: MealCategory,
  ) => Promise<boolean>;
  onUpdate: (
    meal: SavedMeal,
  ) => Promise<boolean>;
  onCancelEdit: () => void;
}) {
  const [name, setName]       = useState(initialMeal?.name ?? "");
  const [cal, setCal]         = useState(initialMeal ? String(initialMeal.macros.cal || "") : "");
  const [protein, setProtein] = useState(initialMeal ? String(initialMeal.macros.protein || "") : "");
  const [carbs, setCarbs]     = useState(initialMeal ? String(initialMeal.macros.carbs || "") : "");
  const [fat, setFat]         = useState(initialMeal ? String(initialMeal.macros.fat || "") : "");
  const [emoji, setEmoji]     = useState(initialMeal?.emoji ?? "🍽️");
  const [category, setCategory] = useState<MealCategory>(initialMeal?.category ?? "other");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const isEditMode = Boolean(initialMeal);

  useEffect(() => {
    setName(initialMeal?.name ?? "");
    setCal(initialMeal ? String(initialMeal.macros.cal || "") : "");
    setProtein(initialMeal ? String(initialMeal.macros.protein || "") : "");
    setCarbs(initialMeal ? String(initialMeal.macros.carbs || "") : "");
    setFat(initialMeal ? String(initialMeal.macros.fat || "") : "");
    setEmoji(initialMeal?.emoji ?? "🍽️");
    setCategory(initialMeal?.category ?? "other");
  }, [initialMeal]);

  const macros: Macros = {
    cal:     Number(cal)     || 0,
    protein: Number(protein) || 0,
    carbs:   Number(carbs)   || 0,
    fat:     Number(fat)     || 0,
  };
  const valid = macros.cal > 0 || macros.protein > 0;

  function reset() {
    setName(""); setCal(""); setProtein(""); setCarbs(""); setFat("");
    setEmoji("🍽️");
    setCategory("other");
    nameRef.current?.focus();
  }

  async function submitLogNow() {
    setIsSubmitting(true);
    try {
      const didSave = await onAdd(name || "Custom meal", macros);
      if (didSave) {
        reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitSaveAndLog() {
    setIsSubmitting(true);
    try {
      const didSave = await onSaveAndAdd(name, macros, emoji, category);
      if (didSave) {
        reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitEdit() {
    if (!initialMeal) return;

    setIsSubmitting(true);
    try {
      await onUpdate({
        ...initialMeal,
        name,
        macros,
        emoji,
        category,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="w-full rounded-md border bg-background px-1.5 py-1.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring sm:w-10"
          maxLength={2}
        />
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Meal name (e.g. Hello Fresh Chicken)"
          className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {MEAL_CATEGORY_OPTIONS.map((option) => {
          const selected = option.value === category;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setCategory(option.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MacroInputRow label="Calories" value={cal}     unit="kcal" onChange={setCal}     />
        <MacroInputRow label="Protein"  value={protein} unit="g"    onChange={setProtein} />
        <MacroInputRow label="Carbs"    value={carbs}   unit="g"    onChange={setCarbs}   />
        <MacroInputRow label="Fat"      value={fat}     unit="g"    onChange={setFat}     />
      </div>
      <div className="flex flex-wrap gap-2">
        {isEditMode ? (
          <>
            <Button
              size="sm"
              disabled={!valid || !name.trim() || !initialMeal || isSubmitting}
              onClick={() => {
                void submitEdit();
              }}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isSubmitting}
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              disabled={!valid || isSubmitting}
              onClick={() => {
                void submitLogNow();
              }}
            >
              {isSubmitting ? "Saving..." : "Log now"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!valid || !name.trim() || isSubmitting}
              onClick={() => {
                void submitSaveAndLog();
              }}
            >
              <BookMarked className="mr-1.5 h-3.5 w-3.5" />
              {isSubmitting ? "Saving..." : "Save & log"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Saved meal pill ───────────────────────────────────────────────────────────

function SavedMealPill({
  meal, isEditing, onAdd, onEdit, onDelete,
}: {
  meal: SavedMeal;
  isEditing: boolean;
  onAdd: (m: SavedMeal) => void;
  onEdit: (meal: SavedMeal) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-muted/30",
        isEditing ? "border-foreground/40 bg-muted/30" : undefined,
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={() => onAdd(meal)}
      >
        <span className="text-base leading-none">{meal.emoji}</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{meal.name}</div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
            {getMealCategoryLabel(meal.category)}
          </div>
          <div className="text-[10px] text-muted-foreground">{macroBadge(meal.macros)}</div>
        </div>
        <Plus className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
      <div className="flex shrink-0 items-center gap-1 sm:invisible sm:group-hover:visible">
        <button
          type="button"
          onClick={() => onEdit(meal)}
          className="text-muted-foreground/50 hover:text-foreground"
          aria-label={`Edit ${meal.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(meal.id)}
          className="text-muted-foreground/40 hover:text-destructive"
          aria-label={`Delete ${meal.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Custom entry row ──────────────────────────────────────────────────────────

function CustomEntryRow({
  entry, onRemove,
}: {
  entry: CustomEntry; onRemove: (id: string) => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium">{entry.name}</div>
        <div className="text-[10px] text-muted-foreground">{macroBadge(entry.macros)}</div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(entry.id)}
        className="shrink-0 text-muted-foreground/40 hover:text-destructive sm:invisible sm:group-hover:visible"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function NutritionPage() {
  const [phase,       setPhase]       = useState<NutritionPhase>("maintain");
  const [log,         setLog]         = useState<NutritionLog>({ date: getLocalDateKey(), eaten: {}, customEntries: [] });
  const [savedMeals,  setSavedMeals]  = useState<SavedMeal[]>([]);
  const [showManual,  setShowManual]  = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);
  const [savedMealsFilter, setSavedMealsFilter] = useState<SavedMealsFilter>("all");
  const [editingSavedMeal, setEditingSavedMeal] = useState<SavedMeal | null>(null);
  const profile = useProfile();

  const reloadNutritionState = useCallback(async () => {
    const [freshLog, freshPhase, freshMeals] = await Promise.all([
      loadNutritionLog(), loadPhase(), loadSavedMeals(),
    ]);
    setLog(freshLog);
    setPhase(freshPhase);
    setSavedMeals(freshMeals);
  }, []);

  useEffect(() => {
    void reloadNutritionState();

    const sync = () => {
      void reloadNutritionState();
    };

    window.addEventListener("nutrition:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nutrition:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [reloadNutritionState]);

  const handlePhaseSelect = async (next: NutritionPhase) => {
    if (next === phase) return;
    await savePhase(next);
    setPhase(next);
    const option = NUTRITION_PHASE_OPTIONS.find((item) => item.value === next);
    toast.success(`${option?.label ?? "Nutrition goal"} selected`);
  };

  const handleManualAdd = async (name: string, macros: Macros) => {
    await addCustomEntry(name, macros);
    await reloadNutritionState();
    toast.success(`${name} added`);
    return true;
  };

  const handleSaveAndAdd = async (
    name: string,
    macros: Macros,
    emoji: string,
    category: MealCategory,
  ) => {
    try {
      await saveNewMeal(name, macros, emoji, category);
      await addCustomEntry(name, macros);
      await reloadNutritionState();
      toast.success(`${name} saved to meals`);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't save that meal right now.";
      toast.error(message);
      return false;
    }
  };

  const handleUpdateSavedMeal = async (meal: SavedMeal) => {
    try {
      await updateSavedMeal(meal);
      await reloadNutritionState();
      setEditingSavedMeal(null);
      toast.success(`${meal.name} updated`);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't update that meal right now.";
      toast.error(message);
      return false;
    }
  };

  const handleQuickAdd = async (meal: SavedMeal) => {
    await logSavedMeal(meal);
    await reloadNutritionState();
    toast.success(`${meal.name} logged`);
  };

  const handleRemoveCustom = async (id: string) => {
    await removeCustomEntry(id);
    await reloadNutritionState();
  };

  const handleDeleteSaved = async (id: string) => {
    if (editingSavedMeal?.id === id) {
      setEditingSavedMeal(null);
    }
    await deleteSavedMeal(id);
    await reloadNutritionState();
  };

  const visibleGoalFocuses = useMemo(
    () => normalizeNutritionGoalFocuses(profile?.nutrition_goal_focuses),
    [profile?.nutrition_goal_focuses],
  );
  const visiblePhaseOptions = useMemo(
    () =>
      NUTRITION_PHASE_OPTIONS.filter((option) =>
        visibleGoalFocuses.includes(option.value),
      ),
    [visibleGoalFocuses],
  );

  useEffect(() => {
    if (visibleGoalFocuses.includes(phase)) return;

    const fallbackPhase = visiblePhaseOptions[0]?.value ?? "maintain";
    setPhase(fallbackPhase);
    void savePhase(fallbackPhase);
  }, [phase, visibleGoalFocuses, visiblePhaseOptions]);

  const targets = useMemo(() => getTargets(phase, profile), [phase, profile]);
  const logged       = useMemo(() => getLoggedMacros(log), [log]);
  const totalEntries = log.customEntries.length;

  const activePhaseOption = useMemo(
    () =>
      visiblePhaseOptions.find((option) => option.value === phase) ??
      NUTRITION_PHASE_OPTIONS.find((option) => option.value === phase) ??
      visiblePhaseOptions[0] ??
      NUTRITION_PHASE_OPTIONS[1],
    [phase, visiblePhaseOptions],
  );
  const filteredSavedMeals = useMemo(
    () =>
      savedMeals
        .filter((meal) => savedMealsFilter === "all" || meal.category === savedMealsFilter)
        .sort((left, right) => left.name.localeCompare(right.name)),
    [savedMeals, savedMealsFilter],
  );

  return (
    <div className="space-y-6">

      {/* Goal selection */}
      <div className="rounded-2xl border bg-card p-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {activePhaseOption.emoji} {activePhaseOption.label}
          </p>
          <p className="text-xs text-muted-foreground">{targets.note}</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {visiblePhaseOptions.map((option) => {
            const selected = option.value === phase;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  void handlePhaseSelect(option.value);
                }}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  selected
                    ? "border-violet-400/60 bg-violet-500/10 shadow-[0_0_0_1px_rgba(167,139,250,0.18)]"
                    : "border-border bg-background hover:bg-muted/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {option.emoji} {option.label}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {option.helper}
                    </p>
                  </div>
                  {selected ? (
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">
                      Active
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">

        {/* Left: log form + saved meals */}
        <div className="space-y-4">

          {/* Log a meal */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Log a meal</CardTitle>
                <Button
                  size="sm"
                  variant={showManual ? "secondary" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => {
                    setEditingSavedMeal(null);
                    setShowManual((s) => !s);
                  }}
                >
                  {showManual ? "Close" : <><Plus className="mr-1 h-3 w-3" />Add</>}
                </Button>
              </div>
              <CardDescription className="text-xs">
                Enter macros manually — for Hello Fresh meals, custom cooking, or anything else.
              </CardDescription>
            </CardHeader>

            {showManual && (
              <CardContent className="pb-4">
                <ManualEntryForm
                  onAdd={handleManualAdd}
                  onSaveAndAdd={handleSaveAndAdd}
                  onUpdate={handleUpdateSavedMeal}
                  onCancelEdit={() => {}}
                />
              </CardContent>
            )}

            {log.customEntries.length > 0 && (
              <CardContent className="space-y-0.5 pt-0 pb-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Logged today
                </p>
                {log.customEntries.map((entry: CustomEntry) => (
                  <CustomEntryRow key={entry.id} entry={entry} onRemove={handleRemoveCustom} />
                ))}
              </CardContent>
            )}
          </Card>

          {/* Saved meals */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Saved meals</CardTitle>
                <button
                  type="button"
                  onClick={() => setShowLibrary((s) => !s)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showLibrary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              <CardDescription className="text-xs">
                Tap any meal to log it instantly. Save new ones below.
              </CardDescription>
            </CardHeader>
            {showLibrary && (
              <CardContent className="space-y-2 pb-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSavedMealsFilter("all")}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      savedMealsFilter === "all"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    All
                  </button>
                  {MEAL_CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSavedMealsFilter(option.value)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        savedMealsFilter === option.value
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {savedMeals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No saved meals yet — use "Save &amp; log" above to build your library.
                  </p>
                ) : filteredSavedMeals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No saved meals in {savedMealsFilter === "all" ? "this view" : getMealCategoryLabel(savedMealsFilter).toLowerCase()} yet.
                  </p>
                ) : (
                  filteredSavedMeals.map((m) => (
                    <div key={m.id} className="space-y-2">
                      <SavedMealPill
                        meal={m}
                        isEditing={editingSavedMeal?.id === m.id}
                        onAdd={handleQuickAdd}
                        onEdit={(meal) => {
                          setEditingSavedMeal((current) =>
                            current?.id === meal.id ? null : meal,
                          );
                        }}
                        onDelete={handleDeleteSaved}
                      />
                      {editingSavedMeal?.id === m.id ? (
                        <ManualEntryForm
                          initialMeal={editingSavedMeal}
                          onAdd={handleManualAdd}
                          onSaveAndAdd={handleSaveAndAdd}
                          onUpdate={handleUpdateSavedMeal}
                          onCancelEdit={() => {
                            setEditingSavedMeal(null);
                          }}
                        />
                      ) : null}
                    </div>
                  ))
                )}
                {savedMeals.length > 0 && savedMealsFilter !== "all" && (
                  <p className="text-[11px] text-muted-foreground">
                    If changing a meal moves it to another category, it will disappear from this filtered view after save.
                  </p>
                )}
              </CardContent>
            )}
          </Card>

        </div>

        {/* Right: macros — sticky on desktop */}
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Today's macros</CardTitle>
              <CardDescription className="text-xs">
                {totalEntries === 0
                  ? "Nothing logged yet."
                  : `${totalEntries} item${totalEntries > 1 ? "s" : ""} logged today.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MacroRow macroKey="cal"     label="Calories" value={logged.cal}     target={targets.cal}     unit="kcal" mode="max" />
              <MacroRow macroKey="protein" label="Protein"  value={logged.protein} target={targets.protein}  unit="g"    mode="min" />
              <Separator />
              <MacroRow macroKey="carbs"   label="Carbs"    value={logged.carbs}   target={targets.carbs}    unit="g"    mode="range" />
              <MacroRow macroKey="fat"     label="Fat"      value={logged.fat}     target={targets.fat}      unit="g"    mode="range" />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
