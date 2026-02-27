import { useEffect, useMemo, useRef, useState } from "react";
import type { ReadingFieldPath } from "./readingTypes";
import {
  canAcceptDigitsOrBlank,
  getReadingStats,
  inputsToPlan,
} from "./readingUtils";
import { ReadingInputsCard } from "./components/ReadingInputsCard";
import { Button } from "@/components/ui/button";
import { ReadingNowCard } from "./components/ReadingNowCard";
import { ReadingNextCard } from "./components/ReadingNextCard";
import {
  loadReadingInputs,
  saveReadingInputs,
  DEFAULT_READING_INPUTS,
} from "./readingStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function ReadingTab() {
  const [inputs, setInputs] = useState(DEFAULT_READING_INPUTS);

  // Draft inputs for adding to queue
  const [draft, setDraft] = useState({ title: "", author: "", totalPages: "" });

  // load once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadReadingInputs();
      if (!cancelled) setInputs(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // debounce saves (prevents spamming Supabase on every keypress)
  const saveTimer = useRef<number | null>(null);
  const didHydrate = useRef(false);

  useEffect(() => {
    // skip the very first render before hydration finishes
    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }

    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(() => {
      saveReadingInputs(inputs).catch((e) => {
        console.warn("saveReadingInputs failed:", e);
      });
    }, 300);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [inputs]);

  const stats = useMemo(() => {
    const plan = inputsToPlan(inputs);
    return getReadingStats(plan);
  }, [inputs]);

  function updateField(path: ReadingFieldPath, value: string) {
    const digitOnlyPaths: ReadingFieldPath[] = [
      "current.currentPage",
      "current.totalPages",
      "dailyGoalPages",
    ];
    if (digitOnlyPaths.includes(path) && !canAcceptDigitsOrBlank(value)) return;

    setInputs((prev) => {
      if (path === "current.title")
        return { ...prev, current: { ...prev.current, title: value } };
      if (path === "current.author")
        return { ...prev, current: { ...prev.current, author: value } };
      if (path === "current.currentPage")
        return { ...prev, current: { ...prev.current, currentPage: value } };
      if (path === "current.totalPages")
        return { ...prev, current: { ...prev.current, totalPages: value } };
      if (path === "dailyGoalPages") return { ...prev, dailyGoalPages: value };
      return prev;
    });
  }

  function addToQueue() {
    if (!draft.title.trim() && !draft.author.trim()) return;

    setInputs((prev) => ({
      ...prev,
      upNext: [...prev.upNext, { ...draft }],
    }));
    setDraft({ title: "", author: "", totalPages: "" });
  }

  function removeFromQueue(index: number) {
    setInputs((prev) => ({
      ...prev,
      upNext: prev.upNext.filter((_, i) => i !== index),
    }));
  }

  function markCurrentCompleted() {
    setInputs((prev) => {
      const finishedAt = new Date().toISOString();
      const totalPagesNum = Math.max(
        1,
        parseInt(prev.current.totalPages || "0", 10) || 0
      );

      const completedBook = {
        title: prev.current.title,
        author: prev.current.author,
        totalPages: totalPagesNum,
        finishedAt,
      };

      const [next, ...rest] = prev.upNext;

      const nextCurrent = next
        ? {
            title: next.title,
            author: next.author,
            currentPage: "0",
            totalPages: next.totalPages,
          }
        : { title: "", author: "", currentPage: "", totalPages: "" };

      return {
        ...prev,
        current: nextCurrent,
        upNext: rest,
        completed: [completedBook, ...prev.completed],
      };
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <ReadingInputsCard value={inputs} onChange={updateField} />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setInputs(DEFAULT_READING_INPUTS)}>
            Reset
          </Button>

          <Button
            variant="secondary"
            onClick={markCurrentCompleted}
            disabled={!inputs.current.title.trim() && !inputs.current.author.trim()}
          >
            Mark current as completed
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add to Up Next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={draft.author}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, author: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Total pages</Label>
                <Input
                  value={draft.totalPages}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!canAcceptDigitsOrBlank(v)) return;
                    setDraft((p) => ({ ...p, totalPages: v }));
                  }}
                  placeholder="e.g. 320"
                />
              </div>
            </div>

            <Separator />

            <Button onClick={addToQueue} disabled={!draft.title.trim() && !draft.author.trim()}>
              Add to queue
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <ReadingNowCard stats={stats} />

        <ReadingNextCard queue={inputs.upNext} onRemove={removeFromQueue} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Completed this year</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inputs.completed.length === 0 ? (
              <div className="text-sm text-muted-foreground">No completed books yet.</div>
            ) : (
              <div className="space-y-3">
                {inputs.completed.map((b, idx) => (
                  <div key={`${b.finishedAt}-${idx}`} className="text-sm">
                    <div className="font-medium">{b.title || "Untitled"}</div>
                    <div className="text-muted-foreground">
                      {b.author || "Unknown author"} · {b.totalPages} pages ·{" "}
                      {new Date(b.finishedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}