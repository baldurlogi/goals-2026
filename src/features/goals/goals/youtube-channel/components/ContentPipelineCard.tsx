import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  getPipeline,
  setPipeline,
  type PipelineItem,
  type PipelineStage,
} from "../youtubeChannelStorage";

const STAGES: PipelineStage[] = [
  "Idea",
  "Script",
  "Record",
  "Edit",
  "Thumbnail",
  "Upload",
  "Published",
];

export function ContentPipelineCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getPipeline(goalId);
  }, [goalId, tick]);

  function patch(items: PipelineItem[]) {
    setPipeline(goalId, { items });
    setTick((x) => x + 1);
  }

  function add() {
    const id = `vid-${Date.now()}`;
    patch([
      { id, title: "New video idea", stage: "Idea", dueISO: null },
      ...state.items,
    ]);
  }

  function update(id: string, p: Partial<PipelineItem>) {
    patch(state.items.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }

  function remove(id: string) {
    patch(state.items.filter((it) => it.id !== id));
  }

  const counts = STAGES.reduce<Record<PipelineStage, number>>((acc, s) => {
    acc[s] = state.items.filter((i) => i.stage === s).length;
    return acc;
  }, {} as any);

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">🎬 Content pipeline</CardTitle>
          <Badge variant="secondary">{counts.Published ?? 0} published</Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {STAGES.map((s) => (
            <span key={s}>
              {s}: <span className="text-foreground font-medium">{counts[s] ?? 0}</span>
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Button className="w-full" onClick={add}>
          Add video
        </Button>

        <Separator />

        <div className="space-y-3">
          {state.items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No videos yet. Add one above.</div>
          ) : null}

          {state.items.slice(0, 6).map((it) => (
            <div key={it.id} className="rounded-xl border p-3 space-y-2">
              <Input
                value={it.title}
                onChange={(e) => update(it.id, { title: e.target.value })}
              />

              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={it.stage === s ? "default" : "outline"}
                    onClick={() => update(it.id, { stage: s })}
                  >
                    {s}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 items-center">
                <div className="text-xs text-muted-foreground">Target date</div>
                <Input
                  type="date"
                  value={it.dueISO ?? ""}
                  onChange={(e) => update(it.id, { dueISO: e.target.value || null })}
                />
              </div>

              <Button variant="ghost" size="sm" onClick={() => remove(it.id)}>
                Remove
              </Button>
            </div>
          ))}

          {state.items.length > 6 ? (
            <div className="text-xs text-muted-foreground">
              Showing 6 items (you have {state.items.length}). We can add paging later.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
