import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { daysUntil, getCountdown, setCountdown, todayISO } from "../travelPlanningStorage";

export function TripCountdownCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getCountdown(goalId);
  }, [goalId, tick]);

  const d = state.departISO ? daysUntil(state.departISO) : null;

  function patch(p: Partial<typeof state>) {
    const cur = getCountdown(goalId);
    setCountdown(goalId, { ...cur, ...p });
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">✈️ Trip countdown</CardTitle>
          <Badge variant="secondary">{state.destination}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Destination</div>
            <Input
              value={state.destination}
              onChange={(e) => patch({ destination: e.target.value })}
              placeholder="e.g. Los Angeles"
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Depart</div>
            <Input
              type="date"
              value={state.departISO ?? ""}
              min={todayISO()}
              onChange={(e) => patch({ departISO: e.target.value || null })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Return</div>
          <Input
            type="date"
            value={state.returnISO ?? ""}
            min={state.departISO ?? todayISO()}
            onChange={(e) => patch({ returnISO: e.target.value || null })}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Days until departure</div>
          <div className="text-2xl font-semibold">{d === null ? "—" : d}</div>
        </div>
      </CardContent>
    </Card>
  );
}
