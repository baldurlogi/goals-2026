import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import {
  diffDays, getRoutineStreak, setRoutineStreak, seedRoutineStreak, todayISO,
  type RoutineStreakState,
} from "../skincareStorage";

export function RoutineStreakCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<RoutineStreakState>(() => seedRoutineStreak(goalId));

  useEffect(() => {
    let cancelled = false;
    getRoutineStreak(goalId).then((fresh) => {
      if (!cancelled) setState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId]);

  const today = todayISO();

  const status = useMemo(() => {
    const last = state.lastISO;
    if (!last) return { label: "No completed days yet", tone: "secondary" as const };
    const d = diffDays(last, today);
    if (d === 0) return { label: "Completed today", tone: "default" as const };
    if (d === 1) return { label: "Complete today to keep streak", tone: "secondary" as const };
    return { label: "Missed days → resets on next completion", tone: "destructive" as const };
  }, [state.lastISO, today]);

  async function markDayComplete() {
    const last = state.lastISO;
    let next: RoutineStreakState;

    if (!last) {
      next = { lastISO: today, streak: 1 };
    } else {
      const d = diffDays(last, today);
      if (d === 0) return;
      next = { lastISO: today, streak: d === 1 ? state.streak + 1 : 1 };
    }

    setState(next);
    await setRoutineStreak(goalId, next);
  }

  async function reset() {
    const next: RoutineStreakState = { lastISO: null, streak: 0 };
    setState(next);
    await setRoutineStreak(goalId, next);
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">✨ Skincare streak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">{state.streak}</div>
            <div className="text-sm text-muted-foreground">completed days</div>
          </div>
          <Badge variant={status.tone}>{status.label}</Badge>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button className="flex-1" onClick={markDayComplete}>Mark day complete</Button>
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: use the checklist below; when AM + PM are done, hit "Mark day complete".
        </div>
      </CardContent>
    </Card>
  );
}