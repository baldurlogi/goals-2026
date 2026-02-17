import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { getNotes, setNotes } from "../travelPlanningStorage";

export function ItineraryNotesCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getNotes(goalId);
  }, [goalId, tick]);

  function update(notes: string) {
    setNotes(goalId, { notes });
    setTick((x) => x + 1);
  }

  function clear() {
    setNotes(goalId, { notes: "" });
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">🗺️ Itinerary notes</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <Textarea
          value={state.notes}
          onChange={(e) => update(e.target.value)}
          placeholder={"Day 1: ...\nDay 2: ...\nRestaurants, hikes, museums, etc."}
          className="min-h-[180px]"
        />

        <Separator />

        <Button variant="ghost" className="w-full" onClick={clear}>
          Clear notes
        </Button>
      </CardContent>
    </Card>
  );
}
