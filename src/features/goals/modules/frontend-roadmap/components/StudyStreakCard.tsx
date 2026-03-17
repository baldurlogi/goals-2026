import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  diffDays, getStudyStreak, setStudyStreak, seedStudyStreak, todayISO,
  type StudyStreakState,
} from "../frontendRoadmapStorage";

export function StudyStreakCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<StudyStreakState>(() => seedStudyStreak(goalId));

  useEffect(() => {
    let cancelled = false;
    getStudyStreak(goalId).then((fresh) => {
      if (!cancelled) setState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId]);

  const today = todayISO();

  const badge = useMemo(() => {
    const last = state.lastISO;
    if (!last) return { label: "No sessions logged yet", variant: "secondary" as const };
    const d = diffDays(last, today);
    if (d === 0) return { label: "Logged today", variant: "default" as const };
    if (d === 1) return { label: "Log today to keep streak", variant: "secondary" as const };
    return { label: "Missed days → reset on next log", variant: "destructive" as const };
  }, [state.lastISO, today]);

  async function logToday() {
    const last = state.lastISO;
    let next: StudyStreakState;

    if (!last) {
      next = { lastISO: today, streak: 1 };
    } else {
      const d = diffDays(last, today);
      if (d === 0) return;
      next = { lastISO: today, streak: d === 1 ? state.streak + 1 : 1 };
    }

    setState(next);
    await setStudyStreak(goalId, next);
  }

  async function reset() {
    const next: StudyStreakState = { lastISO: null, streak: 0 };
    setState(next);
    await setStudyStreak(goalId, next);
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">📚 Study streak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">{state.streak}</div>
            <div className="text-sm text-muted-foreground">days</div>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button className="flex-1" onClick={logToday}>Log study today</Button>
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Counts once per day. If you miss &gt;1 day, next log resets to 1.
        </div>
      </CardContent>
    </Card>
  );
}