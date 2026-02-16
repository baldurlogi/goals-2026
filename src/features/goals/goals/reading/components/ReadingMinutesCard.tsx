import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import { getReadingMinutes, setReadingMinutes } from "../readingStorage";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function ReadingMinutesCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getReadingMinutes(goalId);
  }, [goalId, tick]);

  const pct = state.target <= 0 ? 0 : Math.min(100, Math.round((state.minutes / state.target) * 100));

  function patch(p: Partial<typeof state>) {
    const cur = getReadingMinutes(goalId);
    setReadingMinutes(goalId, { ...cur, ...p });
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">⏱️ Minutes today</CardTitle>
          <Badge variant="secondary">{state.dayISO}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Target</div>
            <Input
              inputMode="numeric"
              value={String(state.target)}
              onChange={(e) => patch({ target: Math.max(0, toNum(e.target.value, 30)) })}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Done</div>
            <Input
              inputMode="numeric"
              value={String(state.minutes)}
              onChange={(e) => patch({ minutes: Math.max(0, toNum(e.target.value, 0)) })}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{state.minutes} / {state.target} min</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="mt-2 h-2" />
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => patch({ minutes: Math.max(0, state.minutes - 5) })}>
            -5
          </Button>
          <Button className="flex-1" onClick={() => patch({ minutes: state.minutes + 5 })}>
            +5
          </Button>
        </div>

        <Button variant="ghost" className="w-full" onClick={() => patch({ minutes: 0 })}>
          Reset today
        </Button>
      </CardContent>
    </Card>
  );
}
