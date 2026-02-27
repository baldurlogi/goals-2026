import { Link } from "react-router-dom";
import { Flame, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNutritionDashboard } from "../hooks/useNutritionDashboard";

function pct(value: number, target: number) {
  return Math.min(Math.max( target > 0 ? Math.round((value / target) * 100) : 0, 0), 100);
}

function MacroPill({
  label,
  value,
  target,
  unit,
  color
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const fillPct = pct(value, target);
  const remaining = target - value;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">
          {label}
        </span>
        <span className="tabular-nums">
          <span className="font-semibold">{value}</span>
          <span className="text-muted-foreground">/{target}{unit}</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{ width: `${fillPct}%`, background: color }}
          />
      </div>
      <div className="text-right text-[10px] text-muted-foreground tabular-nums">
        {remaining > 0 ? `${remaining}${unit} left` : remaining === 0 ? "✓" : `${Math.abs(remaining)}${unit} over`}
      </div>
    </div>
  );
}

export function MacrosCard() {
  const {
    logged,
    target,
    phase,
    calPct,
    mealsEaten,
    totalMeals,
    caloriesRemaining,
    proteinRemaining,
  } = useNutritionDashboard();

  return (
    <Card className="relative overflow-hidden lg:col-span-7">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Macros today
            </span>
            {/* Phase badge */}
            <span className={[
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              phase === "cut"
                ? "bg-rose-500/10 text-rose-500"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            ].join(" ")}>
              {phase === "cut" ? "✂️ Cut" : "💪 Maintain"}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {mealsEaten}/{totalMeals} meals
          </span>
        </div>

        {/* Big calorie number */}
        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-bold tabular-nums leading-none">{logged.cal}</span>
          <span className="mb-0.5 text-sm text-muted-foreground">/ {target.cal} kcal</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-5">
        {/* Calorie bar */}
        <div className="relative h-3 overflow-hidden rounded-full bg-muted">
          <div
            className={[
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
              calPct > 100 ? "bg-destructive" : "bg-gradient-to-r from-orange-500 to-amber-400",
            ].join(" ")}
            style={{ width: `${Math.min(calPct, 100)}%` }}
          />
        </div>

        {/* Macro pills */}
        <div className="grid grid-cols-3 gap-2.5">
          <MacroPill label="Protein" value={logged.protein} target={target.protein} unit="g" color="#22c55e" />
          <MacroPill label="Carbs"   value={logged.carbs}   target={target.carbs}   unit="g" color="#3b82f6" />
          <MacroPill label="Fat"     value={logged.fat}     target={target.fat}     unit="g" color="#a855f7" />
        </div>

        {/* Contextual hint */}
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            {logged.cal === 0 ? (
              <>No meals logged yet — head to <strong>Nutrition</strong> to check off meals.</>
            ) : caloriesRemaining > 0 ? (
              <>
                <span className="font-semibold text-foreground">{caloriesRemaining} kcal</span> remaining ·{" "}
                <span className="font-semibold text-foreground">{Math.max(0, proteinRemaining)}g protein</span> to go
              </>
            ) : (
              <>
                <span className="font-semibold text-orange-500">Over target</span> by {Math.abs(caloriesRemaining)} kcal
              </>
            )}
          </p>
        </div>

        {/* Achievement badges */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {logged.protein >= target.protein && (
              <Badge className="h-5 bg-emerald-500/10 px-2 text-[10px] text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                ✓ Protein
              </Badge>
            )}
            {logged.cal >= target.cal && (
              <Badge className="h-5 bg-amber-500/10 px-2 text-[10px] text-amber-600 hover:bg-amber-500/10 dark:text-amber-400">
                ✓ Calories
              </Badge>
            )}
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Link to="/daily-plan/nutrition">
              Log food <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}