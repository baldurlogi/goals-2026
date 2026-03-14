import { useEffect, useMemo, useState } from "react";
import type { ReadingFieldPath, ReadingInputs } from "./readingTypes";
import { canAcceptDigitsOrBlank, getReadingStats, inputsToPlan, updateReadingStreak } from "./readingUtils";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { Flame, BookOpen } from "lucide-react";
import { ReadingNowCard } from "./components/ReadingNowCard";
import { ReadingNextCard } from "./components/ReadingNextCard";
import { ReadingInputsCard } from "./components/ReadingInputsCard";
import {
  loadReadingInputs,
  saveReadingInputs,
  DEFAULT_READING_INPUTS,
  READING_CHANGED_EVENT,
} from "./readingStorage";
import { Card, CardContent } from "@/components/ui/card";
import type { CompletedBook } from "./readingTypes";

function CompletedBooksSection({ books }: { books: CompletedBook[] }) {
  if (books.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15">
          <BookOpen className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Books finished
        </span>
        <span className="ml-auto text-[11px] font-bold text-amber-500">
          {books.length} {books.length === 1 ? "book" : "books"}
        </span>
      </div>

      {/* Book cards */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {books.map((b, idx) => {
          const date = new Date(b.finishedAt);
          const monthYear = date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
          // Pick a medal for the most recent books
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "📖";

          return (
            <div
              key={`${b.finishedAt}-${idx}`}
              className="group relative overflow-hidden rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 transition-colors hover:bg-amber-500/10"
            >
              {/* Subtle glow on the most recent */}
              {idx === 0 && (
                <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-amber-500/20" />
              )}

              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xl leading-none">{medal}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {b.title || "Untitled"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {b.author || "Unknown author"}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground/60">
                      {b.totalPages} pages
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">·</span>
                    <span className="text-[10px] font-medium text-amber-500/80">
                      {monthYear}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReadingPage() {
  const [inputs, setInputs] = useState<ReadingInputs>(DEFAULT_READING_INPUTS);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const next = await Promise.resolve(loadReadingInputs());
      if (!cancelled) setInputs(next);
    };

    sync();

    window.addEventListener(READING_CHANGED_EVENT, sync as any);
    window.addEventListener("storage", sync as any);

    return () => {
      cancelled = true;
      window.removeEventListener(READING_CHANGED_EVENT, sync as any);
      window.removeEventListener("storage", sync as any);
    };
  }, []);

  const stats = useMemo(() => {
    const plan = inputsToPlan(inputs);
    return getReadingStats(plan);
  }, [inputs]);

  function setAndPersist(updater: (prev: ReadingInputs) => ReadingInputs) {
    setInputs((prev) => {
      const next = updater(prev);
      void Promise.resolve(saveReadingInputs(next));
      return next;
    });
  }

  function updateField(path: ReadingFieldPath, value: string) {
    const digitOnlyPaths: ReadingFieldPath[] = [
      "current.currentPage",
      "current.totalPages",
      "dailyGoalPages",
    ];
    if (digitOnlyPaths.includes(path) && !canAcceptDigitsOrBlank(value)) return;

    setAndPersist((prev) => {
      if (path === "current.title")       return { ...prev, current: { ...prev.current, title: value } };
      if (path === "current.author")      return { ...prev, current: { ...prev.current, author: value } };
      if (path === "current.currentPage") {
        const updated = { ...prev, current: { ...prev.current, currentPage: value } };
        if (value.trim() && Number(value) > 0) {
          const streakUpdate = updateReadingStreak(prev, getLocalDateKey());
          return { ...updated, ...streakUpdate };
        }
        return updated;
      }
      if (path === "current.totalPages")  return { ...prev, current: { ...prev.current, totalPages: value } };
      if (path === "dailyGoalPages")      return { ...prev, dailyGoalPages: value };
      return prev;
    });
  }

  function addToQueue(book: { title: string; author: string; totalPages: string }) {
    setAndPersist((prev) => ({ ...prev, upNext: [...prev.upNext, book] }));
  }

  function removeFromQueue(index: number) {
    setAndPersist((prev) => ({
      ...prev,
      upNext: prev.upNext.filter((_, i) => i !== index),
    }));
  }

  function reorderQueue(newQueue: ReadingInputs["upNext"]) {
    setAndPersist((prev) => ({ ...prev, upNext: newQueue }));
  }

  function markCurrentCompleted() {
    setAndPersist((prev) => {
      const finishedAt = new Date().toISOString();
      const totalPagesNum = Math.max(1, parseInt(prev.current.totalPages || "0", 10) || 0);

      const completedBook = {
        title: prev.current.title,
        author: prev.current.author,
        totalPages: totalPagesNum,
        finishedAt,
      };

      const [next, ...rest] = prev.upNext;
      const nextCurrent = next
        ? { title: next.title, author: next.author, currentPage: "0", totalPages: next.totalPages }
        : { title: "", author: "", currentPage: "", totalPages: "" };

      return {
        ...prev,
        current: nextCurrent,
        upNext: rest,
        completed: [completedBook, ...prev.completed],
      };
    });
  }

  function resetAll() {
    setInputs(DEFAULT_READING_INPUTS);
    void Promise.resolve(saveReadingInputs(DEFAULT_READING_INPUTS));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Left column: inputs + streak ── */}
      <div className="space-y-4">
        <ReadingInputsCard value={inputs} onChange={updateField} />

        {/* Streak card */}
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
              (inputs.streak ?? 0) > 0 ? "bg-orange-500/15" : "bg-muted",
            ].join(" ")}>
              <Flame className={[
                "h-6 w-6",
                (inputs.streak ?? 0) > 0 ? "text-orange-500" : "text-muted-foreground",
              ].join(" ")} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {inputs.streak ?? 0}
                <span className="ml-1 text-sm font-normal text-muted-foreground">day streak</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {(inputs.streak ?? 0) === 0
                  ? "Update your page count to start a streak"
                  : inputs.lastReadDate === getLocalDateKey()
                    ? "You read today — keep it up! 🔥"
                    : "Update today's pages to keep your streak"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Completed books — visible on mobile here, hidden on desktop */}
        <div className="lg:hidden">
          <CompletedBooksSection books={inputs.completed} />
        </div>
      </div>

      {/* ── Right column: now reading + completed + queue ── */}
      <div className="space-y-4">
        <ReadingNowCard
          stats={stats}
          onMarkCompleted={markCurrentCompleted}
          onReset={resetAll}
        />

        {/* Completed books — visible on desktop here */}
        <div className="hidden lg:block">
          <CompletedBooksSection books={inputs.completed} />
        </div>

        <ReadingNextCard
          queue={inputs.upNext}
          onRemove={removeFromQueue}
          onReorder={reorderQueue}
          onAdd={addToQueue}
        />
      </div>
    </div>
  );
}