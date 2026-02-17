import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getFocus, setFocus } from "../frontendRoadmapStorage";

const OPTIONS = ["JavaScript", "TypeScript", "React", "Frontend"] as const;

export function FocusCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getFocus(goalId);
  }, [goalId, tick]);

  function setCurrentFocus(v: (typeof OPTIONS)[number]) {
    setFocus(goalId, { ...getFocus(goalId), currentFocus: v });
    setTick((x) => x + 1);
  }

  function setNotes(notes: string) {
    setFocus(goalId, { ...getFocus(goalId), notes });
    setTick((x) => x + 1);
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
              key={o}
              size="sm"
              variant={o === state.currentFocus ? "default" : "outline"}
              onClick={() => setCurrentFocus(o)}
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
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g. Week plan: finish closures + prototypes; 3 LeetCode; write TS generics notes..."
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
