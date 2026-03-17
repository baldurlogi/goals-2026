import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import { getWeeklyMileage, setWeeklyMileage, seedWeeklyMileage, type WeeklyMileageState } from "../marathonStorage";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function WeeklyMileageCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<WeeklyMileageState>(() => seedWeeklyMileage(goalId));

  useEffect(() => {
    let cancelled = false;
    getWeeklyMileage(goalId).then((fresh) => {
      if (!cancelled) setState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId]);

  const pct = state.targetKm <= 0
    ? 0
    : Math.min(100, Math.round((state.doneKm / state.targetKm) * 100));

  async function patch(p: Partial<WeeklyMileageState>) {
    const next = { ...state, ...p };
    setState(next);
    await setWeeklyMileage(goalId, next);
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">📈 Weekly mileage</CardTitle>
          <Badge variant="secondary">{state.weekStartISO}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Target (km)</div>
            <Input
              inputMode="decimal"
              value={String(state.targetKm)}
              onChange={(e) => patch({ targetKm: Math.max(0, toNum(e.target.value, 20)) })}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Done (km)</div>
            <Input
              inputMode="decimal"
              value={String(state.doneKm)}
              onChange={(e) => patch({ doneKm: Math.max(0, toNum(e.target.value, 0)) })}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{state.doneKm} / {state.targetKm} km</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="mt-2 h-2" />
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => patch({ doneKm: Math.max(0, state.doneKm - 1) })}>
            –1 km
          </Button>
          <Button className="flex-1" onClick={() => patch({ doneKm: state.doneKm + 1 })}>
            +1 km
          </Button>
        </div>

        <Button variant="ghost" className="w-full" onClick={() => patch({ doneKm: 0 })}>
          Reset week
        </Button>
      </CardContent>
    </Card>
  );
}