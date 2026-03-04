import { useEffect, useMemo, useState } from "react";
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
  type PipelineState, // <-- make sure you export this type from storage
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

const EMPTY: PipelineState = { items: [] };

export function ContentPipelineCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<PipelineState>(EMPTY);
  const [tick, setTick] = useState(0);

  // Load async state
  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getPipeline(goalId);
      if (alive) setState(s);
    })();
    return () => {
      alive = false;
    };
  }, [goalId, tick]);

  async function patch(items: PipelineItem[]) {
    await setPipeline(goalId, { items });
    setTick((x) => x + 1); // refresh from source of truth
  }

  async function add() {
    const id = `vid-${Date.now()}`;
    await patch([
      { id, title: "New video idea", stage: "Idea", dueISO: null },
      ...state.items,
    ]);
  }

  async function update(id: string, p: Partial<PipelineItem>) {
    await patch(state.items.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }

  async function remove(id: string) {
    await patch(state.items.filter((it) => it.id !== id));
  }

  const counts = useMemo(() => {
    const base = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<
      PipelineStage,
      number
    >;

    for (const it of state.items) base[it.stage] = (base[it.stage] ?? 0) + 1;
    return base;
  }, [state.items]);

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
              {s}:{" "}
              <span className="text-foreground font-medium">
                {counts[s] ?? 0}
              </span>
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Button className="w-full" onClick={() => void add()}>
          Add video
        </Button>

        <Separator />

        <div className="space-y-3">
          {state.items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No videos yet. Add one above.
            </div>
          ) : null}

          {state.items.slice(0, 6).map((it) => (
            <div key={it.id} className="rounded-xl border p-3 space-y-2">
              <Input
                value={it.title}
                onChange={(e) =>
                  void update(it.id, { title: e.target.value })
                }
              />

              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={it.stage === s ? "default" : "outline"}
                    onClick={() => void update(it.id, { stage: s })}
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
                  onChange={(e) =>
                    void update(it.id, { dueISO: e.target.value || null })
                  }
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => void remove(it.id)}
              >
                Remove
              </Button>
            </div>
          ))}

          {state.items.length > 6 ? (
            <div className="text-xs text-muted-foreground">
              Showing 6 items (you have {state.items.length}). We can add paging
              later.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}