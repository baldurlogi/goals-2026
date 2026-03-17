import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  getUniversityState, setUniversityState, seedUniversityState,
  type UniversityState, type ChecklistItem,
} from "../universityStorage";

export function ChecklistCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<UniversityState>(() => seedUniversityState(goalId));

  useEffect(() => {
    let cancelled = false;
    getUniversityState(goalId).then((fresh) => {
      if (!cancelled) setState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId]);

  async function patchChecklist(checklist: ChecklistItem[]) {
    const next = { ...state, checklist };
    setState(next);
    await setUniversityState(goalId, next);
  }

  function add() {
    patchChecklist([...state.checklist, { id: `ck-${Date.now()}`, label: "New task", done: false }]);
  }

  function update(id: string, p: Partial<ChecklistItem>) {
    patchChecklist(state.checklist.map((c) => (c.id === id ? { ...c, ...p } : c)));
  }

  function remove(id: string) {
    patchChecklist(state.checklist.filter((c) => c.id !== id));
  }

  const done = state.checklist.filter((c) => c.done).length;

  return (
    <Card className="rounded-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">✅ Checklist</CardTitle>
          <Badge variant="secondary">{done}/{state.checklist.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {state.checklist.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-xl border p-3">
            <Checkbox checked={c.done} onCheckedChange={() => update(c.id, { done: !c.done })} />
            <Input value={c.label} onChange={(e) => update(c.id, { label: e.target.value })} />
            <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>Remove</Button>
          </div>
        ))}

        <Separator />
        <Button className="w-full" onClick={add}>Add task</Button>
      </CardContent>
    </Card>
  );
}