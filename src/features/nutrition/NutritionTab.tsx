import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { meals, nutritionTarget } from "./nutritionData";
import { calculateDailyTotals } from "./nutritionUtils";
import { MacroRow } from "./components/MacroRow";
import { MealCard } from "./components/MealCard";

export function NutritionTab() {
    const [breakfastChoice, setBreakfastChoice] = useState<1 | 2>(1);
    const totals = useMemo(() => calculateDailyTotals(breakfastChoice), [breakfastChoice]);

    const breakfast = breakfastChoice === 1 ? meals.breakfast.option1 : meals.breakfast.option2

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Left */}
            <div className="space-y-6">
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

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Daily Totals</CardTitle>
                        <CardDescription className="text-xs">{nutritionTarget.note}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <MacroRow
                            label="Calories"
                            value={totals.cal}
                            target={nutritionTarget.calories}
                            unit="kcal"
                            mode="max"
                        />

                        <MacroRow
                            label="Protein"
                            value={totals.protein}
                            target={nutritionTarget.protein}
                            unit="g"
                            mode="min"
                        />

                        <MacroRow
                            label="Carbs"
                            value={totals.carbs}
                            target={nutritionTarget.carbs}
                            unit="g"
                            mode="range"
                            rangePct={0.10} // +/- 10% window
                        />

                        <MacroRow
                            label="Fat"
                            value={totals.fat}
                            target={nutritionTarget.fat}
                            unit="g"
                            mode="range"
                            rangePct={0.10}
                        />

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Protein check</div>
                            {totals.protein >= 150 ? (
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">✅ On track</Badge>
                            ) : (
                                <Badge variant="secondary">⚠️ Slightly low</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right */}
            <div className="space-y-4">
                <MealCard title="🌅 Breakfast" meal={breakfast} />
                <MealCard title="🥗 Lunch (WFH baseline" meal={meals.lunch.wfh} />

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Office lunch note</CardTitle>
                        <CardDescription className="text-xs">Wed-Fri lunch in provided</CardDescription>
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