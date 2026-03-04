import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getFocus, setFocus, seedFocus, type FocusState } from "../frontendRoadmapStorage";

const OPTIONS = ["JavaScript", "TypeScript", "React", "Frontend"] as const;

export function FocusCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<FocusState>(() => seedFocus(goalId));

  useEffect(() => {
    let cancelled = false;
    getFocus(goalId).then((fresh) => {
      if (!cancelled) setState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId]);

  async function patch(p: Partial<FocusState>) {
    const next = { ...state, ...p };
    setState(next);
    await setFocus(goalId, next);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">🎯 Current focus</CardTitle>
          <Badge variant="secondary">{state.currentFocus}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <Button
              key={o} size="sm"
              variant={o === state.currentFocus ? "default" : "outline"}
              onClick={() => patch({ currentFocus: o })}
            >
              {o}
            </Button>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Notes / next actions</div>
          <Textarea
            value={state.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="E.g. Week plan: finish closures + prototypes; 3 LeetCode; write TS generics notes..."
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}