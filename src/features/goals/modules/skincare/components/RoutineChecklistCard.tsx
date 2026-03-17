import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import {
  getDailyRoutine, setDailyRoutine, seedDailyRoutine,
  getRoutineItems, setRoutineItems, seedRoutineItems,
  todayISO,
  type DailyRoutineState,
} from "../skincareStorage";

function SectionTitle({ title }: { title: string }) {
  return <div className="text-sm font-medium">{title}</div>;
}

type ItemsState = ReturnType<typeof seedRoutineItems>;

export function RoutineChecklistCard({ goalId }: { goalId: string }) {
  const [daily, setDaily] = useState<DailyRoutineState>(() => seedDailyRoutine(goalId));
  const [items, setItems] = useState<ItemsState>(() => seedRoutineItems(goalId));

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDailyRoutine(goalId), getRoutineItems(goalId)]).then(([d, i]) => {
      if (!cancelled) { setDaily(d); setItems(i); }
    });
    return () => { cancelled = true; };
  }, [goalId]);

  async function patchDaily(p: Partial<DailyRoutineState>) {
    const next = { ...daily, ...p };
    setDaily(next);
    await setDailyRoutine(goalId, next);
  }

  async function toggleItem(kind: "am" | "pm", key: string) {
    const next: ItemsState =
      kind === "am"
        ? { ...items, items: { ...items.items, am: { ...items.items.am, [key]: !items.items.am[key as keyof typeof items.items.am] } } }
        : { ...items, items: { ...items.items, pm: { ...items.items.pm, [key]: !items.items.pm[key as keyof typeof items.items.pm] } } };
    setItems(next);
    await setRoutineItems(goalId, next);
  }

  async function resetToday() {
    const today = todayISO();
    const freshDaily: DailyRoutineState = { dayISO: today, amDone: false, pmDone: false };
    const freshItems: ItemsState = {
      dayISO: today,
      items: {
        am: { cleanser: false, moisturizer: false, spf: false },
        pm: { cleanser: false, moisturizer: false, retinoid: false },
      },
    };
    setDaily(freshDaily);
    setItems(freshItems);
    await Promise.all([
      setDailyRoutine(goalId, freshDaily),
      setRoutineItems(goalId, freshItems),
    ]);
  }

  const doneCount =
    Number(daily.amDone) + Number(daily.pmDone) +
    Object.values(items.items.am).filter(Boolean).length +
    Object.values(items.items.pm).filter(Boolean).length;

  return (
    <Card className="rounded-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">🧴 Routine (today)</CardTitle>
          <Badge variant="secondary">{doneCount}/8</Badge>
        </div>
        <div className="text-xs text-muted-foreground">{daily.dayISO}</div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <SectionTitle title="AM" />
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">AM routine done</div>
            <Checkbox checked={daily.amDone} onCheckedChange={() => patchDaily({ amDone: !daily.amDone })} />
          </div>
          <div className="space-y-2">
            {(["cleanser", "moisturizer", "spf"] as const).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <div className="text-sm capitalize">{key}</div>
                <Checkbox checked={items.items.am[key]} onCheckedChange={() => toggleItem("am", key)} />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <SectionTitle title="PM" />
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">PM routine done</div>
            <Checkbox checked={daily.pmDone} onCheckedChange={() => patchDaily({ pmDone: !daily.pmDone })} />
          </div>
          <div className="space-y-2">
            {(["cleanser", "moisturizer", "retinoid"] as const).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <div className="text-sm capitalize">{key}</div>
                <Checkbox checked={items.items.pm[key]} onCheckedChange={() => toggleItem("pm", key)} />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <Button variant="ghost" className="w-full" onClick={resetToday}>
          Reset today
        </Button>
      </CardContent>
    </Card>
  );
}