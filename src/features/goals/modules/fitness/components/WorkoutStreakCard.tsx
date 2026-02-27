import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { diffDays, getStreak, setStreak, todayISO } from "../../../../fitness/fitnessStorage";

export function WorkoutStreakCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getStreak(goalId);
  }, [goalId, tick]);

  const today = todayISO();
  const last = state.lastWorkoutISO;

  const status = useMemo(() => {
    if (!last) return { label: "No workouts logged yet", tone: "secondary" as const };

    const delta = diffDays(last, today);
    if (delta === 0) return { label: "Logged today", tone: "default" as const };
    if (delta === 1) return { label: "Keep it going today", tone: "secondary" as const };
    return { label: "Streak will reset (missed days)", tone: "destructive" as const };
  }, [last, today]);

  function logToday() {
    const current = getStreak(goalId);
    const lastISO = current.lastWorkoutISO;

    if (!lastISO) {
      setStreak(goalId, { lastWorkoutISO: today, streak: 1 });
      setTick((x) => x + 1);
      return;
    }

    const delta = diffDays(lastISO, today);

    // already logged today
    if (delta === 0) return;

    // yesterday -> extend streak
    if (delta === 1) {
      setStreak(goalId, { lastWorkoutISO: today, streak: current.streak + 1 });
      setTick((x) => x + 1);
      return;
    }

    // missed days -> reset to 1
    setStreak(goalId, { lastWorkoutISO: today, streak: 1 });
    setTick((x) => x + 1);
  }

  function reset() {
    setStreak(goalId, { lastWorkoutISO: null, streak: 0 });
    setTick((x) => x + 1);
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
          <Badge variant={status.tone as any}>{status.label}</Badge>
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
