import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { getSkinLog, setSkinLog, seedSkinLog, todayISO, type SkinLogState } from "../skincareStorage";

function clamp1to5(n: number) {
  return Math.max(1, Math.min(5, n));
}

const DEFAULT_RATING = 3;

function RatingDots({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="space-y-2 rounded-xl border bg-card/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{label}</div>
        <Badge variant="secondary">{value}/5</Badge>
      </div>

      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }, (_, index) => {
          const rating = index + 1;
          const active = rating <= value;
          return (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className={cn(
                "h-8 w-8 rounded-full border transition-colors",
                active
                  ? "border-fuchsia-500 bg-fuchsia-500 text-white"
                  : "border-border bg-background text-muted-foreground hover:border-fuchsia-300 hover:text-foreground",
              )}
              aria-label={`${label}: ${rating} out of 5`}
              aria-pressed={active}
            >
              {rating}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export function SkinLogCard({ goalId }: { goalId: string }) {
  const [state, setState] = useState<SkinLogState>(() => seedSkinLog(goalId));

  const today = todayISO();
  const existing = state.entries.find((e) => e.dayISO === today);

  const [irritation, setIrritation] = useState(existing?.irritation ?? DEFAULT_RATING);
  const [acne, setAcne] = useState(existing?.acne ?? DEFAULT_RATING);
  const [hydration, setHydration] = useState(existing?.hydration ?? DEFAULT_RATING);
  const [notes, setNotes] = useState(existing?.notes ?? "");

  useEffect(() => {
    let cancelled = false;

    getSkinLog(goalId).then((fresh) => {
      if (!cancelled) {
        setState(fresh);
        const todayEntry = fresh.entries.find((e) => e.dayISO === today);
        if (todayEntry) {
          setIrritation(todayEntry.irritation);
          setAcne(todayEntry.acne);
          setHydration(todayEntry.hydration);
          setNotes(todayEntry.notes);
        } else {
          setIrritation(DEFAULT_RATING);
          setAcne(DEFAULT_RATING);
          setHydration(DEFAULT_RATING);
          setNotes("");
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [goalId, today]);

  async function save() {
    const entry = {
      dayISO: today,
      irritation: clamp1to5(Number(irritation)),
      acne: clamp1to5(Number(acne)),
      hydration: clamp1to5(Number(hydration)),
      notes,
    };
    const next: SkinLogState = {
      entries: [entry, ...state.entries.filter((e) => e.dayISO !== today)].slice(0, 14),
    };
    setState(next);
    await setSkinLog(goalId, next);
  }

  async function clearAll() {
    const next: SkinLogState = { entries: [] };
    setState(next);
    await setSkinLog(goalId, next);
  }

  const latest = state.entries[0];

  return (
    <Card className="rounded-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">📝 Skin log</CardTitle>
          <Badge variant="secondary">{today}</Badge>
        </div>
        {latest
          ? <div className="text-xs text-muted-foreground">Latest saved: {latest.dayISO}</div>
          : <div className="text-xs text-muted-foreground">No logs yet</div>
        }
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Rate each one from 1 to 5.
          </div>
          <div className="grid gap-3">
            <RatingDots
              label="Irritation"
              value={irritation}
              onChange={setIrritation}
              lowLabel="Calm"
              highLabel="Very irritated"
            />
            <RatingDots
              label="Acne"
              value={acne}
              onChange={setAcne}
              lowLabel="Clear"
              highLabel="Bad breakout"
            />
            <RatingDots
              label="Hydration"
              value={hydration}
              onChange={setHydration}
              lowLabel="Very dry"
              highLabel="Very hydrated"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Notes</div>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Trigger? New product? Sleep? Diet? Stress?" className="min-h-[90px]" />
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={save}>Save today</Button>
          <Button variant="ghost" onClick={clearAll}>Clear</Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Last 7 entries</div>
          <div className="space-y-2">
            {state.entries.slice(0, 7).map((e) => (
              <div key={e.dayISO} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{e.dayISO}</span>
                <span className="font-medium">I {e.irritation} • A {e.acne} • H {e.hydration}</span>
              </div>
            ))}
            {state.entries.length === 0 && (
              <div className="text-sm text-muted-foreground">No data yet.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
