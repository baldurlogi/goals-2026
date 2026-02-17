import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { diffDays, getRoutineStreak, setRoutineStreak, todayISO } from "../skincareStorage";

export function RoutineStreakCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getRoutineStreak(goalId);
  }, [goalId, tick]);

  const today = todayISO();
  const last = state.lastISO;

  const status = useMemo(() => {
    if (!last) return { label: "No completed days yet", tone: "secondary" as const };
    const d = diffDays(last, today);
    if (d === 0) return { label: "Completed today", tone: "default" as const };
    if (d === 1) return { label: "Complete today to keep streak", tone: "secondary" as const };
    return { label: "Missed days → resets on next completion", tone: "destructive" as const };
  }, [last, today]);

  function markDayComplete() {
    const cur = getRoutineStreak(goalId);
    const lastISO = cur.lastISO;

    if (!lastISO) {
      setRoutineStreak(goalId, { lastISO: today, streak: 1 });
      setTick((x) => x + 1);
      return;
    }

    const d = diffDays(lastISO, today);
    if (d === 0) return;
    if (d === 1) setRoutineStreak(goalId, { lastISO: today, streak: cur.streak + 1 });
    else setRoutineStreak(goalId, { lastISO: today, streak: 1 });

    setTick((x) => x + 1);
  }

  function reset() {
    setRoutineStreak(goalId, { lastISO: null, streak: 0 });
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">✨ Skincare streak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">{state.streak}</div>
            <div className="text-sm text-muted-foreground">completed days</div>
          </div>
          <Badge variant={status.tone as any}>{status.label}</Badge>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button className="flex-1" onClick={markDayComplete}>
            Mark day complete
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: use the checklist below; when AM + PM are done, hit “Mark day complete”.
        </div>
      </CardContent>
    </Card>
  );
}
