/**
 * NutritionTab.tsx — updated to log meals via nutritionStorage
 *
 * Each MealCard now has a checkbox/toggle so the user can mark meals as eaten.
 * This data is persisted in localStorage and picked up by the dashboard.
 */

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { meals, nutritionTarget } from "./nutritionData";
import { MacroRow } from "./components/MacroRow";
import { MealCard } from "./components/MealCard";
import {
  loadNutritionLog,
  toggleMeal,
  getLoggedMacros,
  getPlannedMacros,
  type MealKey,
} from "./nutritionStorage";

// ─── meal toggle row ─────────────────────────────────────────────────────────

function MealToggle({
  id,
  label,
  eaten,
  onToggle,
}: {
  id: MealKey;
  label: string;
  eaten: boolean;
  onToggle: (key: MealKey, value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={eaten}
        onCheckedChange={(checked) => onToggle(id, !!checked)}
        className="h-4 w-4"
      />
      <Label
        htmlFor={id}
        className={`cursor-pointer text-sm ${eaten ? "line-through text-muted-foreground" : ""}`}
      >
        {label}
      </Label>
    </div>
  );
}

// ─── tab ─────────────────────────────────────────────────────────────────────

export function NutritionTab() {
  const [breakfastChoice, setBreakfastChoice] = useState<1 | 2>(1);
  const [log, setLog] = useState(() => loadNutritionLog());

  // Keep local state in sync if another tab/window updates storage
  useEffect(() => {
    const sync = () => setLog(loadNutritionLog());
    window.addEventListener("nutrition:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nutrition:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleToggle = (key: MealKey, eaten: boolean) => {
    toggleMeal(key, eaten);
    setLog(loadNutritionLog());
  };

  // planned totals (original behaviour — all meals planned for the day)
  const planned = useMemo(() => getPlannedMacros(breakfastChoice), [breakfastChoice]);
  // logged totals (what's been checked off)
  const logged = useMemo(() => getLoggedMacros(log), [log]);

  const breakfast = breakfastChoice === 1 ? meals.breakfast.option1 : meals.breakfast.option2;
  const breakfastKey: MealKey = breakfastChoice === 1 ? "breakfast1" : "breakfast2";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* ── Left column ── */}
      <div className="space-y-6">
        {/* Breakfast selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Breakfast</CardTitle>
            <CardDescription className="text-xs">
              Choose breakfast to compute daily goals.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant={breakfastChoice === 1 ? "default" : "outline"}
              className="flex-1"
              onClick={() => setBreakfastChoice(1)}
            >
              Overnight oats
            </Button>
            <Button
              variant={breakfastChoice === 2 ? "default" : "outline"}
              className="flex-1"
              onClick={() => setBreakfastChoice(2)}
            >
              Skyr Bowl
            </Button>
          </CardContent>
        </Card>

        {/* Meal check-off card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mark meals eaten</CardTitle>
            <CardDescription className="text-xs">
              Check off each meal as you eat it — your dashboard updates in real time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <MealToggle
              id={breakfastKey}
              label="🌅 Breakfast"
              eaten={!!log.eaten[breakfastKey]}
              onToggle={handleToggle}
            />
            <MealToggle
              id="lunchWfh"
              label="🥗 Lunch"
              eaten={!!log.eaten["lunchWfh"]}
              onToggle={handleToggle}
            />
            <MealToggle
              id="afternoonSnack"
              label="🍎 Afternoon Snack"
              eaten={!!log.eaten["afternoonSnack"]}
              onToggle={handleToggle}
            />
            <MealToggle
              id="postWorkout"
              label="🥤 Post-Workout Shake"
              eaten={!!log.eaten["postWorkout"]}
              onToggle={handleToggle}
            />
            <MealToggle
              id="dinner"
              label="🍽️ Dinner"
              eaten={!!log.eaten["dinner"]}
              onToggle={handleToggle}
            />
          </CardContent>
        </Card>

        {/* Daily Totals — now shows logged vs planned */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily Totals</CardTitle>
            <CardDescription className="text-xs">{nutritionTarget.note}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Logged</span> vs{" "}
              <span className="font-semibold text-foreground">Planned</span> vs{" "}
              <span className="font-semibold text-foreground">Target</span>
            </div>

            <MacroRow
              label="Calories (logged)"
              value={logged.cal}
              target={nutritionTarget.calories}
              unit="kcal"
              mode="max"
            />
            <MacroRow
              label="Calories (planned)"
              value={planned.cal}
              target={nutritionTarget.calories}
              unit="kcal"
              mode="max"
            />

            <Separator />

            <MacroRow
              label="Protein (logged)"
              value={logged.protein}
              target={nutritionTarget.protein}
              unit="g"
              mode="min"
            />
            <MacroRow
              label="Protein (planned)"
              value={planned.protein}
              target={nutritionTarget.protein}
              unit="g"
              mode="min"
            />

            <Separator />

            <MacroRow
              label="Carbs"
              value={planned.carbs}
              target={nutritionTarget.carbs}
              unit="g"
              mode="range"
              rangePct={0.10}
            />

            <MacroRow
              label="Fat"
              value={planned.fat}
              target={nutritionTarget.fat}
              unit="g"
              mode="range"
              rangePct={0.10}
            />

            <Separator />

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Protein check</div>
              {logged.protein >= 150 ? (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">✅ On track</Badge>
              ) : (
                <Badge variant="secondary">⚠️ Slightly low</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Right column — meal cards (unchanged) ── */}
      <div className="space-y-4">
        <MealCard title="🌅 Breakfast" meal={breakfast} />
        <MealCard title="🥗 Lunch (WFH baseline)" meal={meals.lunch.wfh} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Office lunch note</CardTitle>
            <CardDescription className="text-xs">Wed–Fri lunch is provided</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {meals.lunch.office.note}
          </CardContent>
        </Card>

        <MealCard title="🍎 Afternoon Snack" meal={meals.afternoonSnack} />
        <MealCard title="🥤 Post-Workout" meal={meals.postWorkout} />
        <MealCard title="🍽️ Dinner" meal={meals.dinner} />
      </div>
    </div>
  );
}