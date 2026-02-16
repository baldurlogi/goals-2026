import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { getBudget, setBudget, type BudgetLine } from "../travelPlanningStorage";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function BudgetCard({ goalId, currency }: { goalId: string; currency: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getBudget(goalId, currency);
  }, [goalId, currency, tick]);

  const total = state.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const pct = state.target <= 0 ? 0 : Math.min(100, Math.round((total / state.target) * 100));

  function patch(p: Partial<typeof state>) {
    const cur = getBudget(goalId, currency);
    setBudget(goalId, { ...cur, ...p });
    setTick((x) => x + 1);
  }

  function updateLine(id: string, amount: number) {
    const cur = getBudget(goalId, currency);
    const lines = cur.lines.map((l) => (l.id === id ? { ...l, amount } : l));
    setBudget(goalId, { ...cur, lines });
    setTick((x) => x + 1);
  }

  function reset() {
    const cur = getBudget(goalId, currency);
    setBudget(goalId, { ...cur, lines: cur.lines.map((l) => ({ ...l, amount: 0 })) });
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">💳 Trip budget</CardTitle>
          <Badge variant="secondary">{state.currency}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Target ({state.currency})</div>
          <Input
            inputMode="numeric"
            value={String(state.target)}
            onChange={(e) => patch({ target: Math.max(0, toNum(e.target.value, state.target)) })}
          />
        </div>

        <div className="space-y-2">
          {state.lines.map((l: BudgetLine) => (
            <div key={l.id} className="grid grid-cols-2 gap-2 items-center">
              <div className="text-sm text-muted-foreground">{l.label}</div>
              <Input
                inputMode="numeric"
                value={String(l.amount)}
                onChange={(e) => updateLine(l.id, Math.max(0, toNum(e.target.value, 0)))}
              />
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total: {total.toLocaleString()} / {state.target.toLocaleString()} {state.currency}</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="mt-2 h-2" />
        </div>

        <Separator />
        <Button variant="ghost" className="w-full" onClick={reset}>
          Reset budget
        </Button>
      </CardContent>
    </Card>
  );
}
