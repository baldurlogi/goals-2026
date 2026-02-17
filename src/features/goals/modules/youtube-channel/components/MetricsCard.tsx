import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { getMetrics, setMetrics } from "../youtubeChannelStorage";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pct(done: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((done / target) * 100));
}

export function MetricsCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getMetrics(goalId);
  }, [goalId, tick]);

  function patch(p: Partial<typeof state>) {
    const cur = getMetrics(goalId);
    setMetrics(goalId, { ...cur, ...p });
    setTick((x) => x + 1);
  }

  const subsPct = pct(state.subs, state.subsTarget);
  const hoursPct = pct(state.watchHours, state.watchHoursTarget);
  const vidsPct = pct(state.videosThisYear, state.videosTarget);

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">📈 Metrics</CardTitle>
          <Badge variant="secondary">{state.monthLabel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Subscribers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subscribers</span>
            <span className="font-medium">{subsPct}%</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              inputMode="numeric"
              value={String(state.subs)}
              onChange={(e) => patch({ subs: Math.max(0, toNum(e.target.value, 0)) })}
            />
            <Input
              inputMode="numeric"
              value={String(state.subsTarget)}
              onChange={(e) => patch({ subsTarget: Math.max(1, toNum(e.target.value, 1000)) })}
            />
          </div>
          <Progress value={subsPct} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {state.subs.toLocaleString()} / {state.subsTarget.toLocaleString()}
          </div>
        </div>

        <Separator />

        {/* Watch hours */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Watch hours</span>
            <span className="font-medium">{hoursPct}%</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              inputMode="numeric"
              value={String(state.watchHours)}
              onChange={(e) => patch({ watchHours: Math.max(0, toNum(e.target.value, 0)) })}
            />
            <Input
              inputMode="numeric"
              value={String(state.watchHoursTarget)}
              onChange={(e) => patch({ watchHoursTarget: Math.max(1, toNum(e.target.value, 4000)) })}
            />
          </div>
          <Progress value={hoursPct} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {state.watchHours.toLocaleString()} / {state.watchHoursTarget.toLocaleString()}
          </div>
        </div>

        <Separator />

        {/* Videos this year */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Videos (2026)</span>
            <span className="font-medium">{vidsPct}%</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              inputMode="numeric"
              value={String(state.videosThisYear)}
              onChange={(e) => patch({ videosThisYear: Math.max(0, toNum(e.target.value, 0)) })}
            />
            <Input
              inputMode="numeric"
              value={String(state.videosTarget)}
              onChange={(e) => patch({ videosTarget: Math.max(1, toNum(e.target.value, 52)) })}
            />
          </div>
          <Progress value={vidsPct} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {state.videosThisYear.toLocaleString()} / {state.videosTarget.toLocaleString()}
          </div>
        </div>

        <Separator />
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => patch({ subs: 0, watchHours: 0, videosThisYear: 0 })}
        >
          Reset progress
        </Button>
      </CardContent>
    </Card>
  );
}
