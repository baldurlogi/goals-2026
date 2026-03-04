import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import {
  getSchedule,
  setSchedule,
  type ScheduleState, // <-- export this
} from "../youtubeChannelStorage";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const EMPTY: ScheduleState = {
  weekLabel: "",
  targetPerWeek: 0,
  publishedThisWeek: 0,
  nextUploadISO: null,
};

export function UploadScheduleCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<ScheduleState>(EMPTY);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getSchedule(goalId);
      if (alive) setState(s);
    })();
    return () => {
      alive = false;
    };
  }, [goalId, tick]);

  const progressPct =
    state.targetPerWeek <= 0
      ? 0
      : Math.min(
          100,
          Math.round((state.publishedThisWeek / state.targetPerWeek) * 100)
        );

  async function patch(p: Partial<ScheduleState>) {
    const cur = await getSchedule(goalId);
    const next = { ...cur, ...p };
    await setSchedule(goalId, next);
    setTick((x) => x + 1);
  }

  async function resetWeek() {
    const cur = await getSchedule(goalId);
    await patch({
      publishedThisWeek: 0,
      targetPerWeek: cur.targetPerWeek,
      nextUploadISO: cur.nextUploadISO,
    });
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">📅 Upload schedule</CardTitle>
          <Badge variant="secondary">{state.weekLabel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Target / week</div>
            <Input
              inputMode="numeric"
              value={String(state.targetPerWeek)}
              onChange={(e) =>
                void patch({
                  targetPerWeek: Math.max(0, toNum(e.target.value, 1)),
                })
              }
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Published</div>
            <Input
              inputMode="numeric"
              value={String(state.publishedThisWeek)}
              onChange={(e) =>
                void patch({
                  publishedThisWeek: Math.max(0, toNum(e.target.value, 0)),
                })
              }
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {state.publishedThisWeek} / {state.targetPerWeek} videos
            </span>
            <span>{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="mt-2 h-2" />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Next upload date</div>
          <Input
            type="date"
            value={state.nextUploadISO ?? ""}
            onChange={(e) => void patch({ nextUploadISO: e.target.value || null })}
          />
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              void patch({
                publishedThisWeek: Math.max(0, state.publishedThisWeek - 1),
              })
            }
          >
            –1
          </Button>
          <Button
            className="flex-1"
            onClick={() =>
              void patch({ publishedThisWeek: state.publishedThisWeek + 1 })
            }
          >
            +1
          </Button>
        </div>

        <Button variant="ghost" className="w-full" onClick={() => void resetWeek()}>
          Reset week
        </Button>
      </CardContent>
    </Card>
  );
}