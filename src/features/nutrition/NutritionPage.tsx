import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BookMarked,
  Brain,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flame,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { seedNutritionGoalFocuses } from "@/features/onboarding/profileStorage";
import { useAuth } from "@/features/auth/authContext";
import { WaterIntakeCard } from "@/features/dashboard/components/WaterIntakeCard";

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
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
          className="w-full rounded-xl border border-white/8 bg-background/30 px-3 py-2 text-sm tabular-nums shadow-inner focus:outline-none focus:ring-1 focus:ring-emerald-300/50"
          placeholder="0"
          aria-label={`${label} in ${unit}`}
        />
        <span className="shrink-0 text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function MacroChips({ macros }: { macros: Macros }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
        {macros.cal} kcal
      </span>
      <span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
        {macros.protein}g protein
      </span>
      <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100">
        {macros.carbs}g C
      </span>
      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
        {macros.fat}g F
      </span>
    </div>
  );
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

type SavedMealsFilter = "all" | "recent" | "high_protein" | "quick" | MealCategory;

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
    <div className="space-y-4 rounded-[1.5rem] bg-background/22 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.055)]">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="w-full rounded-xl border border-white/8 bg-background/30 px-1.5 py-2 text-center text-sm focus:outline-none focus:ring-1 focus:ring-emerald-300/50 sm:w-12"
          maxLength={2}
        />
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Meal name"
          className="flex-1 rounded-xl border border-white/8 bg-background/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-300/50"
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
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                selected
                  ? "bg-emerald-300 text-slate-950"
                  : "bg-background/28 text-muted-foreground hover:bg-background/45 hover:text-foreground",
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
      <div className="flex flex-wrap gap-2 pt-1">
        {isEditMode ? (
          <>
            <Button
              size="sm"
              disabled={!valid || !name.trim() || !initialMeal || isSubmitting}
              onClick={() => {
                void submitEdit();
              }}
              className="rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isSubmitting}
              onClick={onCancelEdit}
              className="rounded-full text-muted-foreground"
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
              className="rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              {isSubmitting ? "Saving..." : "Log now"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!valid || !name.trim() || isSubmitting}
              onClick={() => {
                void submitSaveAndLog();
              }}
              className="rounded-full bg-background/28 text-foreground hover:bg-background/45"
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
  const highProtein = meal.macros.protein >= 30;

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-3 rounded-[1.2rem] bg-background/18 px-3 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-background/28",
        isEditing ? "bg-emerald-300/10 shadow-[inset_0_0_0_1px_rgba(110,231,183,0.24)]" : undefined,
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={() => onAdd(meal)}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-base leading-none">
          {meal.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold">{meal.name}</div>
            {highProtein ? (
              <span className="hidden rounded-full bg-emerald-300/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-100 sm:inline">
                protein
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/75">
            {getMealCategoryLabel(meal.category)}
          </div>
          <div className="mt-2">
            <MacroChips macros={meal.macros} />
          </div>
        </div>
        <Plus className="ml-auto h-4 w-4 shrink-0 text-emerald-200 opacity-80 transition-opacity group-hover:opacity-100" />
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
    <div className="group flex items-center gap-3 rounded-[1.1rem] bg-background/16 px-3 py-3 transition-colors hover:bg-background/26">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate text-sm font-semibold">{entry.name}</div>
          <div className="shrink-0 text-sm font-bold tabular-nums text-amber-100">
            {entry.macros.cal}
          </div>
        </div>
        <div className="mt-2">
          <MacroChips macros={entry.macros} />
        </div>
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

function macroPct(value: number, target: number) {
  return target > 0 ? Math.round((value / target) * 100) : 0;
}

function buildNutritionInsight({
  logged,
  targets,
  totalEntries,
}: {
  logged: Macros;
  targets: Macros;
  totalEntries: number;
}) {
  const proteinPct = macroPct(logged.protein, targets.protein);
  const calPct = macroPct(logged.cal, targets.cal);

  if (totalEntries === 0) {
    return "No pressure yet. Start with the next easy meal signal.";
  }

  if (proteinPct >= 85 && calPct <= 105) {
    return "Protein pacing is strong today without crowding the calorie target.";
  }

  if (proteinPct < 45 && totalEntries > 0) {
    return "Protein is the quiet lever today. A simple high-protein meal would steady the rhythm.";
  }

  if (calPct > 100) {
    return "Fuel is above target. Keep the next choice lighter and the day still stays useful.";
  }

  return "Meals are taking shape. Keep the next choice simple and repeatable.";
}

function StrategySurface({
  activePhaseOption,
  targets,
  visiblePhaseOptions,
  phase,
  onPhaseSelect,
}: {
  activePhaseOption: (typeof NUTRITION_PHASE_OPTIONS)[number];
  targets: Macros & { note: string };
  visiblePhaseOptions: typeof NUTRITION_PHASE_OPTIONS;
  phase: NutritionPhase;
  onPhaseSelect: (next: NutritionPhase) => void;
}) {
  return (
    <section className="ai-atmosphere ai-depth-stage ai-motion-enter relative overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_16%_10%,rgba(245,158,11,0.15),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(74,222,128,0.12),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.014))] px-4 py-5 shadow-[0_28px_90px_rgba(2,6,23,0.20)] sm:px-6">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-background/24 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100/80">
            <Brain className="h-3.5 w-3.5" />
            Nutrition strategy
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
            {activePhaseOption.emoji} {activePhaseOption.label}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Currently optimizing for {activePhaseOption.label.toLowerCase()} while keeping protein visible and meals low-friction.
          </p>
          <p className="mt-3 border-l border-white/10 pl-3 text-xs leading-5 text-muted-foreground/75">
            {targets.note}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePhaseOptions.map((option) => {
            const selected = option.value === phase;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onPhaseSelect(option.value)}
                className={cn(
                  "rounded-[1.25rem] px-3 py-3 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/60",
                  selected
                    ? "bg-emerald-300 text-slate-950 shadow-[0_18px_44px_rgba(74,222,128,0.16)]"
                    : "bg-background/18 text-muted-foreground hover:-translate-y-0.5 hover:bg-background/30 hover:text-foreground",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {option.emoji} {option.label}
                  </span>
                  {selected ? (
                    <span className="h-2 w-2 rounded-full bg-slate-950/70" />
                  ) : null}
                </div>
                <p className={cn("mt-1 text-xs leading-5", selected ? "text-slate-900/70" : "text-muted-foreground")}>
                  {option.helper}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NutritionSignals({
  insight,
  totalEntries,
  logged,
  targets,
  savedMealCount,
}: {
  insight: string;
  totalEntries: number;
  logged: Macros;
  targets: Macros;
  savedMealCount: number;
}) {
  const proteinPct = macroPct(logged.protein, targets.protein);
  const calPct = macroPct(logged.cal, targets.cal);
  const signals = [
    {
      icon: Flame,
      label: totalEntries > 0 ? "Meals logged" : "Ready to begin",
      detail: totalEntries > 0 ? `${totalEntries} signal${totalEntries === 1 ? "" : "s"} today` : "Start with the easiest meal",
    },
    {
      icon: Activity,
      label: proteinPct >= 80 ? "Protein pacing strong" : "Protein still available",
      detail: `${Math.max(0, proteinPct)}% of target`,
    },
    {
      icon: Utensils,
      label: savedMealCount > 0 ? "Library ready" : "Build repeatability",
      detail: savedMealCount > 0 ? `${savedMealCount} saved meal${savedMealCount === 1 ? "" : "s"}` : "Save meals you repeat",
    },
  ];

  return (
    <section className="ai-layer-soft rounded-[1.75rem] p-4">
      <div className="flex items-start gap-3">
        <span className="ai-float flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-100">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
            Nutrition signals
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {signals.map((signal) => {
          const Icon = signal.icon;
          return (
            <div key={signal.label} className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-amber-100/80" />
              <div>
                <p className="text-sm font-medium">{signal.label}</p>
                <p className="text-xs text-muted-foreground">{signal.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background/45">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 transition-all duration-700"
          style={{ width: `${Math.min(Math.max(calPct, 4), 100)}%` }}
        />
      </div>
    </section>
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
  const { userId } = useAuth();

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

  const visibleGoalFocuses = useMemo(() => {
    if (profile?.nutrition_goal_focuses?.length) {
      return normalizeNutritionGoalFocuses(profile.nutrition_goal_focuses);
    }

    const cachedGoalFocuses = seedNutritionGoalFocuses(userId);
    if (cachedGoalFocuses?.length) {
      return normalizeNutritionGoalFocuses(cachedGoalFocuses);
    }

    return normalizeNutritionGoalFocuses(profile?.nutrition_goal_focuses);
  }, [profile?.nutrition_goal_focuses, userId]);
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
    () => {
      const recentNames = new Set(
        log.customEntries
          .slice()
          .sort((left, right) => right.loggedAt - left.loggedAt)
          .map((entry) => entry.name.trim().toLowerCase()),
      );

      return savedMeals
        .filter((meal) => {
          if (savedMealsFilter === "all") return true;
          if (savedMealsFilter === "recent") {
            return recentNames.has(meal.name.trim().toLowerCase());
          }
          if (savedMealsFilter === "high_protein") return meal.macros.protein >= 30;
          if (savedMealsFilter === "quick") return meal.macros.cal <= 650;
          return meal.category === savedMealsFilter;
        })
        .sort((left, right) => {
          const leftRecent = recentNames.has(left.name.trim().toLowerCase());
          const rightRecent = recentNames.has(right.name.trim().toLowerCase());
          if (leftRecent !== rightRecent) return leftRecent ? -1 : 1;
          return left.name.localeCompare(right.name);
        });
    },
    [log.customEntries, savedMeals, savedMealsFilter],
  );
  const recentSavedMealsCount = useMemo(() => {
    const recentNames = new Set(
      log.customEntries.map((entry) => entry.name.trim().toLowerCase()),
    );
    return savedMeals.filter((meal) =>
      recentNames.has(meal.name.trim().toLowerCase()),
    ).length;
  }, [log.customEntries, savedMeals]);
  const highProteinSavedMealsCount = useMemo(
    () => savedMeals.filter((meal) => meal.macros.protein >= 30).length,
    [savedMeals],
  );
  const quickSavedMealsCount = useMemo(
    () => savedMeals.filter((meal) => meal.macros.cal <= 650).length,
    [savedMeals],
  );
  const nutritionInsight = useMemo(
    () => buildNutritionInsight({ logged, targets, totalEntries }),
    [logged, targets, totalEntries],
  );
  const savedMealFilters: Array<{
    value: SavedMealsFilter;
    label: string;
    count?: number;
  }> = [
    { value: "all", label: "All", count: savedMeals.length },
    { value: "recent", label: "Recently logged", count: recentSavedMealsCount },
    { value: "high_protein", label: "High protein", count: highProteinSavedMealsCount },
    { value: "quick", label: "Quick meals", count: quickSavedMealsCount },
    ...MEAL_CATEGORY_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ];

  return (
    <div className="relative -mx-4 -mt-6 min-h-[calc(100vh-5rem)] overflow-hidden px-4 pb-12 pt-6 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_2%,rgba(245,158,11,0.11),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(74,222,128,0.10),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_44%)]" />

      <div className="mx-auto max-w-7xl space-y-8">
        <StrategySurface
          activePhaseOption={activePhaseOption}
          targets={targets}
          visiblePhaseOptions={visiblePhaseOptions}
          phase={phase}
          onPhaseSelect={(next) => {
            void handlePhaseSelect(next);
          }}
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start">
          <div className="space-y-8">
            <section className="ai-layer relative overflow-hidden rounded-[1.85rem] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/80">
                    Fast meal signal
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Log without breaking flow</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                    Add what matters, keep the day moving, and let the system carry the totals.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 rounded-full bg-background/26 px-3 text-xs text-foreground hover:bg-background/42"
                  onClick={() => {
                    setEditingSavedMeal(null);
                    setShowManual((s) => !s);
                  }}
                >
                  {showManual ? "Close" : <><Plus className="mr-1.5 h-3.5 w-3.5" />Add</>}
                </Button>
              </div>

              {showManual ? (
                <div className="mt-4">
                  <ManualEntryForm
                    onAdd={handleManualAdd}
                    onSaveAndAdd={handleSaveAndAdd}
                    onUpdate={handleUpdateSavedMeal}
                    onCancelEdit={() => {}}
                  />
                </div>
              ) : null}

              {log.customEntries.length > 0 ? (
                <div className="mt-5 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Logged today
                  </p>
                  {log.customEntries.map((entry: CustomEntry) => (
                    <CustomEntryRow key={entry.id} entry={entry} onRemove={handleRemoveCustom} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[1.35rem] bg-background/16 px-4 py-5 text-sm text-muted-foreground">
                  No meals logged yet. Start with one simple entry or tap a saved meal below.
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
                    Meal library
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Curated repeatability</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLibrary((s) => !s)}
                  className="rounded-full bg-background/24 p-2 text-muted-foreground transition-colors hover:bg-background/40 hover:text-foreground"
                  aria-label={showLibrary ? "Hide saved meals" : "Show saved meals"}
                >
                  {showLibrary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {showLibrary ? (
                <div className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {savedMealFilters.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setSavedMealsFilter(filter.value)}
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          savedMealsFilter === filter.value
                            ? "bg-emerald-300 text-slate-950"
                            : "bg-background/22 text-muted-foreground hover:bg-background/38 hover:text-foreground",
                        )}
                      >
                        {filter.label}
                        {typeof filter.count === "number" ? (
                          <span className="ml-1 opacity-70">{filter.count}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  {savedMeals.length === 0 ? (
                    <div className="ai-layer-soft rounded-[1.75rem] px-5 py-7 text-center">
                      <BookMarked className="mx-auto h-5 w-5 text-emerald-200" />
                      <p className="mt-3 text-sm font-medium">No saved meals yet.</p>
                      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                        Save the meals you actually repeat so logging becomes one tap.
                      </p>
                    </div>
                  ) : filteredSavedMeals.length === 0 ? (
                    <div className="rounded-[1.5rem] bg-background/16 px-4 py-5 text-sm text-muted-foreground">
                      No meals in this view yet.
                    </div>
                  ) : (
                    <div className="grid gap-3 xl:grid-cols-2">
                      {filteredSavedMeals.map((m) => (
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
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          </div>

          <div className="space-y-5 lg:sticky lg:top-6">
            <NutritionSignals
              insight={nutritionInsight}
              totalEntries={totalEntries}
              logged={logged}
              targets={targets}
              savedMealCount={savedMeals.length}
            />

            <section className="ai-layer relative overflow-hidden rounded-[1.85rem] p-4 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Today's macros
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Supportive pacing</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {totalEntries === 0
                      ? "Nothing logged yet."
                      : `${totalEntries} item${totalEntries > 1 ? "s" : ""} logged today.`}
                  </p>
                </div>
                <Utensils className="h-5 w-5 text-amber-100/80" />
              </div>
              <div className="space-y-4">
                <MacroRow macroKey="cal" label="Calories" value={logged.cal} target={targets.cal} unit="kcal" mode="max" />
                <MacroRow macroKey="protein" label="Protein" value={logged.protein} target={targets.protein} unit="g" mode="min" />
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <MacroRow macroKey="carbs" label="Carbs" value={logged.carbs} target={targets.carbs} unit="g" mode="range" />
                <MacroRow macroKey="fat" label="Fat" value={logged.fat} target={targets.fat} unit="g" mode="range" />
              </div>
            </section>

            <div className="relative">
              <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                <Droplets className="h-3.5 w-3.5" />
                Hydration rhythm
              </div>
              <WaterIntakeCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
