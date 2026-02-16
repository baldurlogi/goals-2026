import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import { daysUntil, getUniversityState, setUniversityState, type Deadline } from "../universityStorage";

export function DeadlinesCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getUniversityState(goalId);
  }, [goalId, tick]);

  const sorted = [...state.deadlines].sort((a, b) => a.dueISO.localeCompare(b.dueISO));

  function patch(deadlines: Deadline[]) {
    setUniversityState(goalId, { ...getUniversityState(goalId), deadlines });
    setTick((x) => x + 1);
  }

  function add() {
    const id = `dl-${Date.now()}`;
    patch([...state.deadlines, { id, label: "New deadline", dueISO: "2026-04-01", done: false }]);
  }

  function update(id: string, p: Partial<Deadline>) {
    patch(state.deadlines.map((d) => (d.id === id ? { ...d, ...p } : d)));
  }

  function remove(id: string) {
    patch(state.deadlines.filter((d) => d.id !== id));
  }

  const next = sorted.find((d) => !d.done);
  const nextBadge =
    next ? `${Math.max(0, daysUntil(next.dueISO))}d` : "All done";

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">⏳ Deadlines</CardTitle>
          <Badge variant="secondary">Next: {nextBadge}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {sorted.map((d) => (
          <div key={d.id} className="rounded-xl border p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={d.done} onCheckedChange={() => update(d.id, { done: !d.done })} />
                <div className="text-sm font-medium">{d.label}</div>
              </div>
              <Badge variant="outline">{Math.max(0, daysUntil(d.dueISO))}d</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input value={d.label} onChange={(e) => update(d.id, { label: e.target.value })} />
              <Input type="date" value={d.dueISO} onChange={(e) => update(d.id, { dueISO: e.target.value })} />
            </div>

            <Button variant="ghost" size="sm" onClick={() => remove(d.id)}>
              Remove
            </Button>
          </div>
        ))}

        <Separator />
        <Button className="w-full" onClick={add}>
          Add deadline
        </Button>
      </CardContent>
    </Card>
  );
}
