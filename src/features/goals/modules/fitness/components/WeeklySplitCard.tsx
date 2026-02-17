import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { getMondayISO, getWeeklySplit, setWeeklySplit, todayISO } from "../fitnessStorage";

const PLAN: Array<{ day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"; label: string }> =
  [
    { day: "Mon", label: "Upper Push" },
    { day: "Tue", label: "Lower Squat" },
    { day: "Wed", label: "Swim" },
    { day: "Thu", label: "Upper Pull" },
    { day: "Fri", label: "Lower Hinge" },
    { day: "Sat", label: "CrossFit" },
    { day: "Sun", label: "Rest" },
  ];

export function WeeklySplitCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    const current = getWeeklySplit(goalId);

    // auto-roll week on Monday change
    const nowMonday = getMondayISO(new Date());
    if (current.weekStartISO !== nowMonday) {
      const reset = {
        weekStartISO: nowMonday,
        doneByDay: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false },
      };
      setWeeklySplit(goalId, reset);
      return reset;
    }

    return current;
  }, [goalId, tick]);

  const doneCount = Object.values(state.doneByDay).filter(Boolean).length;

  function toggle(day: (typeof PLAN)[number]["day"]) {
    const next = getWeeklySplit(goalId);
    next.doneByDay = { ...next.doneByDay, [day]: !next.doneByDay[day] };
    setWeeklySplit(goalId, next);
    setTick((x) => x + 1);
  }

  function clearWeek() {
    const monday = getMondayISO(new Date());
    setWeeklySplit(goalId, {
      weekStartISO: monday,
      doneByDay: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false },
    });
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">📅 Weekly split</CardTitle>
          <Badge variant="secondary">{doneCount}/7</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          Week of {state.weekStartISO} • Today: {todayISO()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {PLAN.map((p) => (
          <div key={p.day} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={state.doneByDay[p.day]}
                onCheckedChange={() => toggle(p.day)}
              />
              <div className="text-sm">
                <span className="font-medium">{p.day}</span>{" "}
                <span className="text-muted-foreground">— {p.label}</span>
              </div>
            </div>
          </div>
        ))}

        <Separator />
        <Button variant="ghost" onClick={clearWeek} className="w-full">
          Clear week
        </Button>
      </CardContent>
    </Card>
  );
}
