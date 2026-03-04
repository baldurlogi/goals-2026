import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import {
  getMetrics,
  setMetrics,
  type MetricsState, // <-- export this
} from "../youtubeChannelStorage";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pct(done: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((done / target) * 100));
}

const EMPTY: MetricsState = {
  monthLabel: "",
  subs: 0,
  subsTarget: 1000,
  watchHours: 0,
  watchHoursTarget: 4000,
  videosThisYear: 0,
  videosTarget: 52,
};

export function MetricsCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<MetricsState>(EMPTY);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getMetrics(goalId);
      if (alive) setState(s);
    })();
    return () => {
      alive = false;
    };
  }, [goalId, tick]);

  async function patch(p: Partial<MetricsState>) {
    const cur = await getMetrics(goalId);
    await setMetrics(goalId, { ...cur, ...p });
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
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subscribers</span>
            <span className="font-medium">{subsPct}%</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              inputMode="numeric"
              value={String(state.subs)}
              onChange={(e) =>
                void patch({ subs: Math.max(0, toNum(e.target.value, 0)) })
              }
            />
            <Input
              inputMode="numeric"
              value={String(state.subsTarget)}
              onChange={(e) =>
                void patch({
                  subsTarget: Math.max(1, toNum(e.target.value, 1000)),
                })
              }
            />
          </div>
          <Progress value={subsPct} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {state.subs.toLocaleString()} / {state.subsTarget.toLocaleString()}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Watch hours</span>
            <span className="font-medium">{hoursPct}%</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              inputMode="numeric"
              value={String(state.watchHours)}
              onChange={(e) =>
                void patch({
                  watchHours: Math.max(0, toNum(e.target.value, 0)),
                })
              }
            />
            <Input
              inputMode="numeric"
              value={String(state.watchHoursTarget)}
              onChange={(e) =>
                void patch({
                  watchHoursTarget: Math.max(
                    1,
                    toNum(e.target.value, 4000)
                  ),
                })
              }
            />
          </div>
          <Progress value={hoursPct} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {state.watchHours.toLocaleString()} /{" "}
            {state.watchHoursTarget.toLocaleString()}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Videos (2026)</span>
            <span className="font-medium">{vidsPct}%</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              inputMode="numeric"
              value={String(state.videosThisYear)}
              onChange={(e) =>
                void patch({
                  videosThisYear: Math.max(0, toNum(e.target.value, 0)),
                })
              }
            />
            <Input
              inputMode="numeric"
              value={String(state.videosTarget)}
              onChange={(e) =>
                void patch({
                  videosTarget: Math.max(1, toNum(e.target.value, 52)),
                })
              }
            />
          </div>
          <Progress value={vidsPct} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {state.videosThisYear.toLocaleString()} /{" "}
            {state.videosTarget.toLocaleString()}
          </div>
        </div>

        <Separator />
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => void patch({ subs: 0, watchHours: 0, videosThisYear: 0 })}
        >
          Reset progress
        </Button>
      </CardContent>
    </Card>
  );
}