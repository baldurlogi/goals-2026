import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import { getDailyRoutine, setDailyRoutine, getRoutineItems, setRoutineItems } from "../skincareStorage";

function SectionTitle({ title }: { title: string }) {
  return <div className="text-sm font-medium">{title}</div>;
}

export function RoutineChecklistCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const daily = useMemo(() => {
    void tick;
    return getDailyRoutine(goalId);
  }, [goalId, tick]);

  const items = useMemo(() => {
    void tick;
    return getRoutineItems(goalId);
  }, [goalId, tick]);

  function patchDaily(p: Partial<typeof daily>) {
    const cur = getDailyRoutine(goalId);
    setDailyRoutine(goalId, { ...cur, ...p });
    setTick((x) => x + 1);
  }
type AMKey = keyof (ReturnType<typeof getRoutineItems> extends infer T
  ? T extends { items: { am: infer A } }
    ? A
    : never
  : never);

type PMKey = keyof (ReturnType<typeof getRoutineItems> extends infer T
  ? T extends { items: { pm: infer P } }
    ? P
    : never
  : never);

  // Overloads (this is what makes TS happy)
  function toggleItem(kind: "am", key: AMKey): void;
  function toggleItem(kind: "pm", key: PMKey): void;
  function toggleItem(kind: "am" | "pm", key: AMKey | PMKey) {
    const cur = getRoutineItems(goalId);

    if (kind === "am") {
      const k = key as AMKey;
      const next = {
        ...cur,
        items: {
          ...cur.items,
          am: { ...cur.items.am, [k]: !cur.items.am[k] },
        },
      };
      setRoutineItems(goalId, next);
    } else {
      const k = key as PMKey;
      const next = {
        ...cur,
        items: {
          ...cur.items,
          pm: { ...cur.items.pm, [k]: !cur.items.pm[k] },
        },
      };
      setRoutineItems(goalId, next);
    }

    setTick((x) => x + 1);
  }

  function resetToday() {
    setDailyRoutine(goalId, { ...daily, amDone: false, pmDone: false });
    setRoutineItems(goalId, {
      dayISO: items.dayISO,
      items: {
        am: { cleanser: false, moisturizer: false, spf: false },
        pm: { cleanser: false, moisturizer: false, retinoid: false },
      },
    });
    setTick((x) => x + 1);
  }

  const doneCount =
    Number(daily.amDone) + Number(daily.pmDone) +
    Object.values(items.items.am).filter(Boolean).length +
    Object.values(items.items.pm).filter(Boolean).length;

  const totalCount = 2 + 3 + 3;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">🧴 Routine (today)</CardTitle>
          <Badge variant="secondary">{doneCount}/{totalCount}</Badge>
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
            <div className="flex items-center justify-between">
              <div className="text-sm">Cleanser</div>
              <Checkbox checked={items.items.am.cleanser} onCheckedChange={() => toggleItem("am", "cleanser")} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Moisturizer</div>
              <Checkbox checked={items.items.am.moisturizer} onCheckedChange={() => toggleItem("am", "moisturizer")} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">SPF</div>
              <Checkbox checked={items.items.am.spf} onCheckedChange={() => toggleItem("am", "spf")} />
            </div>
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
            <div className="flex items-center justify-between">
              <div className="text-sm">Cleanser</div>
              <Checkbox checked={items.items.pm.cleanser} onCheckedChange={() => toggleItem("pm", "cleanser")} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Moisturizer</div>
              <Checkbox checked={items.items.pm.moisturizer} onCheckedChange={() => toggleItem("pm", "moisturizer")} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Retinoid</div>
              <Checkbox checked={items.items.pm.retinoid} onCheckedChange={() => toggleItem("pm", "retinoid")} />
            </div>
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
