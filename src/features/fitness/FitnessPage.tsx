import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Trash2, BookMarked, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { meals, getTargets, type NutritionPhase } from "../nutrition/nutritionData";
import { MacroRow } from "../nutrition/components/MacroRow";
import { MealCard } from "../nutrition/components/MealCard";
import {
  loadNutritionLog,
  loadPhase,
  loadSavedMeals,
  savePhase,
  saveNewMeal,
  deleteSavedMeal,
  logSavedMeal,
  toggleMeal,
  addCustomEntry,
  removeCustomEntry,
  getLoggedMacros,
  type MealKey,
  type SavedMeal,
  type CustomEntry,
  type NutritionLog,
} from "../nutrition/nutritionStorage";
import type { Macros } from "../nutrition/nutritionTypes";

// ── tiny helpers ──────────────────────────────────────────────────────────────

function MacroInputRow({
  label, value, unit, onChange,
}: {
  label: string; value: string; unit: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="0"
        />
        <span className="shrink-0 text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function macroBadge(m: Macros) {
  return `${m.cal} kcal · ${m.protein}g P · ${m.carbs}g C · ${m.fat}g F`;
}

// ── Manual entry form ─────────────────────────────────────────────────────────

function ManualEntryForm({
  onAdd,
  onSaveAndAdd,
}: {
  onAdd:       (name: string, macros: Macros) => void;
  onSaveAndAdd:(name: string, macros: Macros, emoji: string) => void;
}) {
  const [name,    setName]    = useState("");
  const [cal,     setCal]     = useState("");
  const [protein, setProtein] = useState("");
  const [carbs,   setCarbs]   = useState("");
  const [fat,     setFat]     = useState("");
  const [emoji,   setEmoji]   = useState("🍽️");
  const nameRef = useRef<HTMLInputElement>(null);

  const macros: Macros = {
    cal:     Number(cal)     || 0,
    protein: Number(protein) || 0,
    carbs:   Number(carbs)   || 0,
    fat:     Number(fat)     || 0,
  };

  const valid = macros.cal > 0 || macros.protein > 0;

  function reset() {
    setName(""); setCal(""); setProtein(""); setCarbs(""); setFat("");
    nameRef.current?.focus();
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
      {/* Meal name + emoji */}
      <div className="flex gap-2">
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="w-10 rounded-md border bg-background px-1.5 py-1.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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

      {/* Macro inputs */}
      <div className="grid grid-cols-4 gap-2">
        <MacroInputRow label="Calories" value={cal}     unit="kcal" onChange={setCal}     />
        <MacroInputRow label="Protein"  value={protein} unit="g"    onChange={setProtein} />
        <MacroInputRow label="Carbs"    value={carbs}   unit="g"    onChange={setCarbs}   />
        <MacroInputRow label="Fat"      value={fat}     unit="g"    onChange={setFat}     />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={!valid}
          onClick={() => { onAdd(name || "Custom meal", macros); reset(); }}
        >
          Log now
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!valid || !name.trim()}
          onClick={() => { onSaveAndAdd(name, macros, emoji); reset(); }}
          title="Save to your meal library and log today"
        >
          <BookMarked className="mr-1.5 h-3.5 w-3.5" />
          Save & log
        </Button>
      </div>
    </div>
  );
}

// ── Saved meal pill ───────────────────────────────────────────────────────────

function SavedMealPill({
  meal, onAdd, onDelete,
}: {
  meal: SavedMeal;
  onAdd:    (m: SavedMeal) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 hover:bg-muted/30 transition-colors">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={() => onAdd(meal)}
      >
        <span className="text-base leading-none">{meal.emoji}</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{meal.name}</div>
          <div className="text-[10px] text-muted-foreground">{macroBadge(meal.macros)}</div>
        </div>
        <Plus className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(meal.id)}
        className="invisible shrink-0 text-muted-foreground/40 hover:text-destructive group-hover:visible"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Custom entry row (today's logged items) ────────────────────────────────────

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
        className="invisible shrink-0 text-muted-foreground/40 hover:text-destructive group-hover:visible"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── MealToggle ────────────────────────────────────────────────────────────────

function MealToggle({ id, label, eaten, onToggle }: {
  id: MealKey; label: string; eaten: boolean;
  onToggle: (key: MealKey, value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id={id} checked={eaten} onCheckedChange={(c) => onToggle(id, !!c)} />
      <Label htmlFor={id} className={`cursor-pointer text-sm ${eaten ? "line-through text-muted-foreground" : ""}`}>
        {label}
      </Label>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function NutritionTab() {
  const [breakfastChoice, setBreakfastChoice] = useState<1 | 2>(1);

    // ✅ safe defaults, then hydrate in the effect
    const [phase, setPhase] = useState<NutritionPhase>("maintain");
    const [log, setLog] = useState<NutritionLog>(() => ({
    date: new Date().toISOString().slice(0, 10),
    eaten: {},
    customEntries: [],
  }));

  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [showManual,  setShowManual]  = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);

  useEffect(() => {
    async function init() {
      const [freshLog, freshPhase, freshMeals] = await Promise.all([
        loadNutritionLog(), loadPhase(), loadSavedMeals(),
      ]);
      setLog(freshLog);
      setPhase(freshPhase);
      setSavedMeals(freshMeals);
    }
    init();

    const sync = async () => {
      const [freshLog, freshPhase, freshMeals] = await Promise.all([
        loadNutritionLog(), loadPhase(), loadSavedMeals(),
      ]);
      setLog(freshLog);
      setPhase(freshPhase);
      setSavedMeals(freshMeals);
    };
    window.addEventListener("nutrition:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nutrition:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handlePhaseToggle = async () => {
    const next: NutritionPhase = phase === "maintain" ? "cut" : "maintain";
    await savePhase(next);
    setPhase(next);
  };

  const handleToggle = async (key: MealKey, eaten: boolean) => {
    await toggleMeal(key, eaten);
    setLog(await loadNutritionLog());
  };

  const handleManualAdd = async (name: string, macros: Macros) => {
    await addCustomEntry(name, macros);
    setLog(await loadNutritionLog());
  };

  const handleSaveAndAdd = async (name: string, macros: Macros, emoji: string) => {
    saveNewMeal(name, macros, emoji);
    await addCustomEntry(name, macros);
    setLog(await loadNutritionLog());
    setSavedMeals(await loadSavedMeals());
  };

  const handleQuickAdd = async (meal: SavedMeal) => {
    await logSavedMeal(meal);
    setLog(await loadNutritionLog());
  };

  const handleRemoveCustom = async (id: string) => {
    await removeCustomEntry(id);
    setLog(await loadNutritionLog());
  };

  const handleDeleteSaved = async (id: string) => {
    await deleteSavedMeal(id);
    setSavedMeals(await loadSavedMeals());
  };

  const targets    = useMemo(() => getTargets(phase), [phase]);
  const logged     = useMemo(() => getLoggedMacros(log), [log]);
  const breakfast  = breakfastChoice === 1 ? meals.breakfast.option1 : meals.breakfast.option2;
  const breakfastKey: MealKey = breakfastChoice === 1 ? "breakfast1" : "breakfast2";
  const totalEntries = Object.values(log.eaten).filter(Boolean).length + log.customEntries.length;

  return (
    <div className="space-y-6">
      {/* ── Phase toggle banner ── */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-semibold">
            {phase === "cut" ? "✂️ Cut phase" : "💪 Maintain / Lean bulk"}
          </p>
          <p className="text-xs text-muted-foreground">{targets.note}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={phase === "cut"}
          onClick={handlePhaseToggle}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
            "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            phase === "cut" ? "bg-rose-500" : "bg-muted",
          ].join(" ")}
        >
          <span className={[
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200",
            phase === "cut" ? "translate-x-5" : "translate-x-0",
          ].join(" ")} />
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* Today's macros summary — top of left col for quick reference */}
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
              <MacroRow label="Calories" value={logged.cal}     target={targets.cal} unit="kcal" mode="max" />
              <MacroRow label="Protein"  value={logged.protein} target={targets.protein}  unit="g"    mode="min" />
              <Separator />
              <MacroRow label="Carbs"    value={logged.carbs}   target={targets.carbs}    unit="g"    mode="range" />
              <MacroRow label="Fat"      value={logged.fat}     target={targets.fat}      unit="g"    mode="range" />
            </CardContent>
          </Card>

          {/* Meal plan checkboxes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={breakfastChoice === 1 ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setBreakfastChoice(1)}
                >
                  Overnight oats
                </Button>
                <Button
                  variant={breakfastChoice === 2 ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setBreakfastChoice(2)}
                >
                  Skyr Bowl
                </Button>
              </div>
              <CardDescription className="text-xs mt-2">
                Tick off plan meals as you eat them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MealToggle id={breakfastKey}   label="🌅 Breakfast"          eaten={!!log.eaten[breakfastKey]}     onToggle={handleToggle} />
              <MealToggle id="lunchWfh"       label="🥗 Lunch"              eaten={!!log.eaten["lunchWfh"]}       onToggle={handleToggle} />
              <MealToggle id="afternoonSnack" label="🍎 Afternoon snack"    eaten={!!log.eaten["afternoonSnack"]} onToggle={handleToggle} />
              <MealToggle id="postWorkout"    label="🥤 Post-workout shake" eaten={!!log.eaten["postWorkout"]}    onToggle={handleToggle} />
              <MealToggle id="dinner"         label="🍽️ Dinner"             eaten={!!log.eaten["dinner"]}         onToggle={handleToggle} />
            </CardContent>
          </Card>

          {/* ── Saved meals quick-add ── */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Saved meals</CardTitle>
                <button
                  type="button"
                  onClick={() => setShowLibrary((s) => !s)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showLibrary
                    ? <ChevronUp className="h-4 w-4" />
                    : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              <CardDescription className="text-xs">
                Tap any meal to log it instantly. Save new ones below.
              </CardDescription>
            </CardHeader>
            {showLibrary && (
              <CardContent className="space-y-2 pb-4">
                {savedMeals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No saved meals yet — use "Save & log" below to build your library.
                  </p>
                ) : (
                  savedMeals.map((m) => (
                    <SavedMealPill
                      key={m.id}
                      meal={m}
                      onAdd={handleQuickAdd}
                      onDelete={handleDeleteSaved}
                    />
                  ))
                )}
              </CardContent>
            )}
          </Card>

          {/* ── Manual / custom log ── */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Log a custom meal</CardTitle>
                <Button
                  size="sm"
                  variant={showManual ? "secondary" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => setShowManual((s) => !s)}
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
                />
              </CardContent>
            )}

            {/* Custom entries logged today */}
            {log.customEntries.length > 0 && (
              <CardContent className="space-y-0.5 pt-0 pb-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Logged today
                </p>
                {log.customEntries.map((entry) => (
                  <CustomEntryRow
                    key={entry.id}
                    entry={entry}
                    onRemove={handleRemoveCustom}
                  />
                ))}
              </CardContent>
            )}
          </Card>
        </div>

        {/* ── Right column — meal reference cards ── */}
        <div className="space-y-4">
          <MealCard title="🌅 Breakfast" meal={breakfast} />
          <MealCard title="🥗 Lunch (WFH)" meal={meals.lunch.wfh} />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Office lunch note</CardTitle>
              <CardDescription className="text-xs">Wed–Fri lunch is provided</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {meals.lunch.office.note}
            </CardContent>
          </Card>
          <MealCard title="🍎 Afternoon snack" meal={meals.afternoonSnack} />
          <MealCard title="🥤 Post-workout"    meal={meals.postWorkout} />
          <MealCard title="🍽️ Dinner"          meal={meals.dinner} />
        </div>
      </div>
    </div>
  );
}