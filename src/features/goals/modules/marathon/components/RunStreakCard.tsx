import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { diffDays, getRunStreak, setRunStreak, seedRunStreak, todayISO, type RunStreakState } from "../marathonStorage";

export function RunStreakCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<RunStreakState>(() => seedRunStreak(goalId));

  useEffect(() => {
    let cancelled = false;
    getRunStreak(goalId).then((fresh) => {
      if (!cancelled) setState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId]);

  const today = todayISO();

  const status = useMemo(() => {
    const last = state.lastRunISO;
    if (!last) return { label: "No runs logged yet", tone: "secondary" as const };
    const d = diffDays(last, today);
    if (d === 0) return { label: "Logged today", tone: "default" as const };
    if (d === 1) return { label: "Run today to keep streak", tone: "secondary" as const };
    return { label: "Missed days → reset on next log", tone: "destructive" as const };
  }, [state.lastRunISO, today]);

  async function logToday() {
    const last = state.lastRunISO;
    let next: RunStreakState;

    if (!last) {
      next = { lastRunISO: today, streak: 1 };
    } else {
      const d = diffDays(last, today);
      if (d === 0) return;
      next = { lastRunISO: today, streak: d === 1 ? state.streak + 1 : 1 };
    }

    setState(next);
    await setRunStreak(goalId, next);
  }

  async function reset() {
    const next: RunStreakState = { lastRunISO: null, streak: 0 };
    setState(next);
    await setRunStreak(goalId, next);
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">🏃 Run streak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">{state.streak}</div>
            <div className="text-sm text-muted-foreground">days</div>
          </div>
          <Badge variant={status.tone}>{status.label}</Badge>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button className="flex-1" onClick={logToday}>Log run today</Button>
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Counts once per day. If you miss &gt;1 day, streak resets on the next log.
        </div>
      </CardContent>
    </Card>
  );
}