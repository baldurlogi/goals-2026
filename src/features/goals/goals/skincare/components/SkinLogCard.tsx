import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { getSkinLog, setSkinLog, todayISO } from "../skincareStorage";

function clamp1to5(n: number) {
  return Math.max(1, Math.min(5, n));
}

export function SkinLogCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getSkinLog(goalId);
  }, [goalId, tick]);

  const today = todayISO();
  const existing = state.entries.find((e) => e.dayISO === today);

  const [irritation, setIrritation] = useState(existing?.irritation ?? 3);
  const [acne, setAcne] = useState(existing?.acne ?? 3);
  const [hydration, setHydration] = useState(existing?.hydration ?? 3);
  const [notes, setNotes] = useState(existing?.notes ?? "");

  function save() {
    const entry = {
      dayISO: today,
      irritation: clamp1to5(Number(irritation)),
      acne: clamp1to5(Number(acne)),
      hydration: clamp1to5(Number(hydration)),
      notes,
    };

    const cur = getSkinLog(goalId);
    const withoutToday = cur.entries.filter((e) => e.dayISO !== today);
    const next = { entries: [entry, ...withoutToday].slice(0, 14) }; // keep last 14 logs
    setSkinLog(goalId, next);
    setTick((x) => x + 1);
  }

  function clearAll() {
    setSkinLog(goalId, { entries: [] });
    setTick((x) => x + 1);
  }

  const latest = state.entries[0];

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">📝 Skin log</CardTitle>
          <Badge variant="secondary">{today}</Badge>
        </div>
        {latest ? (
          <div className="text-xs text-muted-foreground">
            Latest saved: {latest.dayISO}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No logs yet</div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Irritation</div>
            <Input inputMode="numeric" value={String(irritation)} onChange={(e) => setIrritation(clamp1to5(Number(e.target.value)))} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Acne</div>
            <Input inputMode="numeric" value={String(acne)} onChange={(e) => setAcne(clamp1to5(Number(e.target.value)))} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Hydration</div>
            <Input inputMode="numeric" value={String(hydration)} onChange={(e) => setHydration(clamp1to5(Number(e.target.value)))} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Notes</div>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Trigger? New product? Sleep? Diet? Stress?" className="min-h-[90px]" />
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={save}>
            Save today
          </Button>
          <Button variant="ghost" onClick={clearAll}>
            Clear
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Last 7 entries</div>
          <div className="space-y-2">
            {state.entries.slice(0, 7).map((e) => (
              <div key={e.dayISO} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{e.dayISO}</span>
                <span className="font-medium">
                  I {e.irritation} • A {e.acne} • H {e.hydration}
                </span>
              </div>
            ))}
            {state.entries.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data yet.</div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
