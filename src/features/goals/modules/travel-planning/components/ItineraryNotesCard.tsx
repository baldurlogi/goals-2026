import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { getNotes, setNotes, seedNotes, type NotesState } from "../travelPlanningStorage";

export function ItineraryNotesCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<NotesState>(() => seedNotes(goalId));

  useEffect(() => {
    let cancelled = false;
    getNotes(goalId).then((fresh) => {
      if (!cancelled) setState(fresh);
    });
    return () => { cancelled = true; };
  }, [goalId]);

  async function update(notes: string) {
    const next = { notes };
    setState(next);
    await setNotes(goalId, next);
  }

  async function clear() {
    const next = { notes: "" };
    setState(next);
    await setNotes(goalId, next);
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