import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import {
  completeRoutineStreakDay,
  getDisplayedRoutineStreak,
  getRoutineCompletionStatus,
  getRoutineStreak,
  setRoutineStreak,
  seedRoutineStreak,
  todayISO,
  type RoutineStreakState,
} from "../skincareStorage";
import { GOAL_MODULE_CHANGED_EVENT } from "@/lib/goalModuleStorage";

export function RoutineStreakCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<RoutineStreakState>(() => seedRoutineStreak(goalId));

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      const fresh = await getRoutineStreak(goalId);
      if (!cancelled) setState(fresh);
    }

    void fetch();
    window.addEventListener(GOAL_MODULE_CHANGED_EVENT, fetch);
    window.addEventListener("storage", fetch);

    return () => {
      cancelled = true;
      window.removeEventListener(GOAL_MODULE_CHANGED_EVENT, fetch);
      window.removeEventListener("storage", fetch);
    };
  }, [goalId]);

  const today = todayISO();
  const status = getRoutineCompletionStatus(state, today);
  const displayedStreak = getDisplayedRoutineStreak(state, today);

  async function markDayComplete() {
    const next = completeRoutineStreakDay(state, today);
    if (next.lastISO === state.lastISO && next.streak === state.streak) return;

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
            <div className="text-2xl font-semibold">{displayedStreak}</div>
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
          Tip: completing both AM and PM today updates your streak automatically.
        </div>
      </CardContent>
    </Card>
  );
}
