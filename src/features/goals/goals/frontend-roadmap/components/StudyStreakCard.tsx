import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  diffDays,
  getStudyStreak,
  setStudyStreak,
  todayISO,
} from "../frontendRoadmapStorage";

export function StudyStreakCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getStudyStreak(goalId);
  }, [goalId, tick]);

  const today = todayISO();
  const last = state.lastISO;

  const badge = useMemo(() => {
    if (!last) return { label: "No sessions logged yet", variant: "secondary" as const };
    const d = diffDays(last, today);
    if (d === 0) return { label: "Logged today", variant: "default" as const };
    if (d === 1) return { label: "Log today to keep streak", variant: "secondary" as const };
    return { label: "Missed days → reset on next log", variant: "destructive" as const };
  }, [last, today]);

  function logToday() {
    const cur = getStudyStreak(goalId);
    const lastISO = cur.lastISO;

    if (!lastISO) {
      setStudyStreak(goalId, { lastISO: today, streak: 1 });
      setTick((x) => x + 1);
      return;
    }

    const d = diffDays(lastISO, today);
    if (d === 0) return;
    if (d === 1) {
      setStudyStreak(goalId, { lastISO: today, streak: cur.streak + 1 });
    } else {
      setStudyStreak(goalId, { lastISO: today, streak: 1 });
    }
    setTick((x) => x + 1);
  }

  function reset() {
    setStudyStreak(goalId, { lastISO: null, streak: 0 });
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">📚 Study streak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">{state.streak}</div>
            <div className="text-sm text-muted-foreground">days</div>
          </div>
          <Badge variant={badge.variant as any}>{badge.label}</Badge>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button className="flex-1" onClick={logToday}>
            Log study today
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Counts once per day. If you miss &gt;1 day, next log resets to 1.
        </div>
      </CardContent>
    </Card>
  );
}
