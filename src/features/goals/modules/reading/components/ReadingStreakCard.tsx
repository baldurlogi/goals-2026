import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  diffDays,
  getReadingStreak,
  setReadingStreak,
  todayISO,
} from "../readingStorage";

export function ReadingStreakCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getReadingStreak(goalId);
  }, [goalId, tick]);

  const today = todayISO();
  const last = state.lastReadISO;

  const status = useMemo(() => {
    if (!last) return { label: "No reading logged yet", tone: "secondary" as const };
    const d = diffDays(last, today);
    if (d === 0) return { label: "Logged today", tone: "default" as const };
    if (d === 1) return { label: "Read today to keep streak", tone: "secondary" as const };
    return { label: "Missed days → reset on next log", tone: "destructive" as const };
  }, [last, today]);

  function logToday() {
    const cur = getReadingStreak(goalId);
    const lastISO = cur.lastReadISO;

    if (!lastISO) {
      setReadingStreak(goalId, { lastReadISO: today, streak: 1 });
      setTick((x) => x + 1);
      return;
    }

    const d = diffDays(lastISO, today);
    if (d === 0) return;

    if (d === 1) setReadingStreak(goalId, { lastReadISO: today, streak: cur.streak + 1 });
    else setReadingStreak(goalId, { lastReadISO: today, streak: 1 });

    setTick((x) => x + 1);
  }

  function reset() {
    setReadingStreak(goalId, { lastReadISO: null, streak: 0 });
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">📖 Reading streak</CardTitle>
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
          <Button className="flex-1" onClick={logToday}>
            Log reading today
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
