import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  getMondayISO,
  getWeeklySplit,
  setWeeklySplit,
  seedWeeklySplit,
  todayISO,
  type WeeklySplitState,
} from "@/features/fitness/fitnessStorage";

const PLAN: Array<{ day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"; label: string }> = [
  { day: "Mon", label: "Upper Push" },
  { day: "Tue", label: "Lower Squat" },
  { day: "Wed", label: "Swim" },
  { day: "Thu", label: "Upper Pull" },
  { day: "Fri", label: "Lower Hinge" },
  { day: "Sat", label: "CrossFit" },
  { day: "Sun", label: "Rest" },
];

function freshWeek(): WeeklySplitState {
  return {
    weekStartISO: getMondayISO(),
    doneByDay: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false },
  };
}

export function WeeklySplitCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<WeeklySplitState>(() => {
    const cached = seedWeeklySplit(goalId);
    // auto-roll on mount if week changed
    return cached.weekStartISO === getMondayISO() ? cached : freshWeek();
  });

  useEffect(() => {
    let cancelled = false;
    getWeeklySplit(goalId).then((fresh) => {
      if (!cancelled) {
        // auto-roll if week changed
        setState(fresh.weekStartISO === getMondayISO() ? fresh : freshWeek());
      }
    });
    return () => { cancelled = true; };
  }, [goalId]);

  const doneCount = Object.values(state.doneByDay).filter(Boolean).length;

  async function toggle(day: (typeof PLAN)[number]["day"]) {
    const next: WeeklySplitState = {
      ...state,
      doneByDay: { ...state.doneByDay, [day]: !state.doneByDay[day] },
    };
    setState(next);
    await setWeeklySplit(goalId, next);
  }

  async function clearWeek() {
    const next = freshWeek();
    setState(next);
    await setWeeklySplit(goalId, next);
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