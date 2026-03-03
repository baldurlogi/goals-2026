import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  getRevenue, setRevenue, seedRevenue,
  type RevenueState,
} from "../freelanceStorage";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function RevenueCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<RevenueState>(() => seedRevenue(goalId));

  // Fetch from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    getRevenue(goalId).then((fresh) => {
      if (!cancelled) setState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId]);

  const pct = state.monthlyTargetDKK <= 0
    ? 0
    : Math.min(100, Math.round((state.earnedDKK / state.monthlyTargetDKK) * 100));

  async function update(patch: Partial<RevenueState>) {
    const next = { ...state, ...patch };
    setState(next);              // optimistic
    await setRevenue(goalId, next);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">💰 Revenue (this month)</CardTitle>
          <Badge variant="secondary">{state.monthLabel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Target (DKK)</div>
            <Input
              inputMode="numeric"
              value={String(state.monthlyTargetDKK)}
              onChange={(e) => update({ monthlyTargetDKK: toNum(e.target.value, 15000) })}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Earned (DKK)</div>
            <Input
              inputMode="numeric"
              value={String(state.earnedDKK)}
              onChange={(e) => update({ earnedDKK: toNum(e.target.value, 0) })}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{state.earnedDKK.toLocaleString()} / {state.monthlyTargetDKK.toLocaleString()} DKK</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="mt-2 h-2" />
        </div>

        <Separator />

        <Button variant="ghost" className="w-full" onClick={() => update({ earnedDKK: 0 })}>
          Reset month
        </Button>
      </CardContent>
    </Card>
  );
}