import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { getDrills, setDrills } from "../frontendRoadmapStorage";

export function DrillTrackerCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getDrills(goalId);
  }, [goalId, tick]);

  const pct =
    state.target <= 0 ? 0 : Math.min(100, Math.round((state.leetcodeDone / state.target) * 100));

  function patch(delta: number) {
    const cur = getDrills(goalId);
    const next = {
      ...cur,
      leetcodeDone: Math.max(0, Math.min(cur.target, cur.leetcodeDone + delta)),
    };
    setDrills(goalId, next);
    setTick((x) => x + 1);
  }

  function resetMonth() {
    const cur = getDrills(goalId);
    setDrills(goalId, { ...cur, leetcodeDone: 0 });
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
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
          <Button variant="outline" className="flex-1" onClick={() => patch(-1)}>
            –1
          </Button>
          <Button className="flex-1" onClick={() => patch(+1)}>
            +1
          </Button>
        </div>

        <Separator />
        <Button variant="ghost" className="w-full" onClick={resetMonth}>
          Reset month
        </Button>
      </CardContent>
    </Card>
  );
}
