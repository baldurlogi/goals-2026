import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  diffDays,
  getStreak,
  setStreak,
  seedStreak,
  todayISO,
  type StreakState,
} from "../../../../fitness/fitnessStorage";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function WorkoutStreakCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<StreakState>(() => seedStreak(goalId));

  useEffect(() => {
    let cancelled = false;
    getStreak(goalId).then((fresh) => {
      if (!cancelled) setState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId]);

  const today = todayISO();

  const status = useMemo((): { label: string; variant: BadgeVariant } => {
    const last = state.lastWorkoutISO;
    if (!last) return { label: "No workouts logged yet", variant: "secondary" };
    const delta = diffDays(last, today);
    if (delta === 0) return { label: "Logged today", variant: "default" };
    if (delta === 1) return { label: "Keep it going today", variant: "secondary" };
    return { label: "Streak will reset (missed days)", variant: "destructive" };
  }, [state.lastWorkoutISO, today]);

  async function logToday() {
    const last = state.lastWorkoutISO;
    let next: StreakState;

    if (!last) {
      next = { lastWorkoutISO: today, streak: 1 };
    } else {
      const delta = diffDays(last, today);
      if (delta === 0) return; // already logged
      next = { lastWorkoutISO: today, streak: delta === 1 ? state.streak + 1 : 1 };
    }

    setState(next);
    await setStreak(goalId, next);
  }

  async function reset() {
    const next: StreakState = { lastWorkoutISO: null, streak: 0 };
    setState(next);
    await setStreak(goalId, next);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">🔥 Workout streak</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">{state.streak}</div>
            <div className="text-sm text-muted-foreground">days</div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button onClick={logToday} className="flex-1">
            Log workout today
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: logging counts once per day; if you miss &gt;1 day, streak resets.
        </div>
      </CardContent>
    </Card>
  );
}