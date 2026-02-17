import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getSaaS, setSaaS, type SaaSStage } from "../freelanceStorage";

const STAGES: SaaSStage[] = [
  "Idea validation",
  "MVP design",
  "MVP build",
  "Beta users",
  "Payments (Stripe)",
  "Launch (Product Hunt)",
  "First paying customer",
];

export function SaaSStageCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getSaaS(goalId);
  }, [goalId, tick]);

  function setStage(stage: SaaSStage) {
    setSaaS(goalId, { ...getSaaS(goalId), stage });
    setTick((x) => x + 1);
  }

  function setNotes(notes: string) {
    setSaaS(goalId, { ...getSaaS(goalId), notes });
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">🚀 SaaS launch</CardTitle>
          <Badge variant="secondary">{state.stage}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === state.stage ? "default" : "outline"}
              onClick={() => setStage(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Notes / next actions</div>
          <Textarea
            value={state.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g. Talk to 10 users: 3/10 done. Next: reach out to X, Y..."
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}