import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { getDrills, setDrills, seedDrills, type DrillState } from "../frontendRoadmapStorage";

export function DrillTrackerCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<DrillState>(() => seedDrills(goalId));

  useEffect(() => {
    let cancelled = false;
    getDrills(goalId).then((fresh) => {
      if (!cancelled) setState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId]);

  const pct = state.target <= 0
    ? 0
    : Math.min(100, Math.round((state.leetcodeDone / state.target) * 100));

  async function patch(delta: number) {
    const next = {
      ...state,
      leetcodeDone: Math.max(0, Math.min(state.target, state.leetcodeDone + delta)),
    };
    setState(next);
    await setDrills(goalId, next);
  }

  async function resetMonth() {
    const next = { ...state, leetcodeDone: 0 };
    setState(next);
    await setDrills(goalId, next);
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">🧠 LeetCode (this month)</CardTitle>
          <Badge variant="secondary">{state.monthLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {state.leetcodeDone} / {state.target} problems
          </div>
          <div className="text-sm font-medium">{pct}%</div>
        </div>
        <Progress value={pct} className="h-2" />

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => patch(-1)}>–1</Button>
          <Button className="flex-1" onClick={() => patch(+1)}>+1</Button>
        </div>

        <Separator />
        <Button variant="ghost" className="w-full" onClick={resetMonth}>
          Reset month
        </Button>
      </CardContent>
    </Card>
  );
}