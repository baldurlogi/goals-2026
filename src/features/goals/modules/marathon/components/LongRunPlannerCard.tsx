import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getLongRun, setLongRun, todayISO } from "../marathonStorage";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function LongRunPlannerCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getLongRun(goalId);
  }, [goalId, tick]);

  function patch(p: Partial<typeof state>) {
    const cur = getLongRun(goalId);
    setLongRun(goalId, { ...cur, ...p });
    setTick((x) => x + 1);
  }

  const scheduled = state.scheduledISO ?? "Not set";

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">🗓️ Next long run</CardTitle>
          <Badge variant="secondary">{scheduled}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Distance (km)</div>
            <Input
              inputMode="decimal"
              value={String(state.nextLongRunKm)}
              onChange={(e) => patch({ nextLongRunKm: Math.max(0, toNum(e.target.value, 10)) })}
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Date</div>
            <Input
              type="date"
              value={state.scheduledISO ?? ""}
              min={todayISO()}
              onChange={(e) => patch({ scheduledISO: e.target.value || null })}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Notes (fueling, pacing, route)</div>
          <Textarea
            value={state.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Example: easy pace, gel at 45 min, route: Lakes → Amager Strand..."
            className="min-h-[96px]"
          />
        </div>

        <Button variant="ghost" className="w-full" onClick={() => patch({ notes: "" })}>
          Clear notes
        </Button>
      </CardContent>
    </Card>
  );
}
