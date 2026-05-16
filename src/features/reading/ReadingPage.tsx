import { useEffect, useMemo, useRef, useState } from "react";
import type { CompletedBook, ReadingFieldPath, ReadingInputs } from "./readingTypes";
import {
  canAcceptDigitsOrBlank,
  getReadingStats,
  getDisplayedReadingStreak,
  inputsToPlan,
} from "./readingUtils";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { BookOpen, Brain, Flame, Moon, Sparkles, Waves } from "lucide-react";
import { ReadingNowCard } from "./components/ReadingNowCard";
import { ReadingNextCard } from "./components/ReadingNextCard";
import { DEFAULT_READING_INPUTS } from "./readingStorage";
import { useReadingQuery, useSaveReadingMutation } from "./useReadingQuery";
import { formatDateWithPreferences, type UserPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";

function CompletedBooksSection({
  books,
  preferences,
}: {
  books: CompletedBook[];
  preferences: UserPreferences;
}) {
  if (books.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300/80">
            Finished shelf
          </p>
          <h2 className="mt-1 text-xl font-semibold">Milestones kept warm</h2>
        </div>
        <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
          {books.length} {books.length === 1 ? "book" : "books"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {books.map((b, idx) => {
          const date = new Date(b.finishedAt);
          const monthYear = formatDateWithPreferences(date, preferences, {
            month: "short",
            year: "numeric",
          });

          return (
            <div
              key={`${b.finishedAt}-${idx}`}
              className="group relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-amber-300/10 via-background/18 to-background/8 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.045)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-300/10"
            >
              {idx === 0 && (
                <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
              )}

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/34 text-amber-200">
                  <BookOpen className="h-4 w-4" />
                </span>
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
    </section>
  );
}

function ReadingSignals({
  displayedStreak,
  lastReadDate,
  pct,
  pagesLeft,
  dailyGoalPages,
  queueCount,
}: {
  displayedStreak: number;
  lastReadDate: string | null;
  pct: number;
  pagesLeft: number;
  dailyGoalPages: number;
  queueCount: number;
}) {
  const readToday = lastReadDate === getLocalDateKey();
  const momentum =
    displayedStreak >= 7
      ? "Strong reading rhythm"
      : displayedStreak >= 3
        ? "Momentum building"
        : readToday
          ? "Signal protected"
          : "Ready for today's signal";
  const observation =
    pct >= 70
      ? "Your current thread is entering its closing arc."
      : pagesLeft <= dailyGoalPages * 3
        ? "A short focus window can move this book meaningfully."
        : queueCount > 0
          ? "Your next ideas are already forming a path."
          : "One future book would give the system more trajectory.";

  const signals = [
    {
      icon: Flame,
      label: momentum,
      detail:
        displayedStreak > 0
          ? `${displayedStreak} day${displayedStreak === 1 ? "" : "s"} of continuity`
          : "Start with a small page update",
    },
    {
      icon: Waves,
      label: "Immersion pulse",
      detail: pct > 0 ? `${pct}% absorbed in the current book` : "Awaiting first session",
    },
    {
      icon: Moon,
      label: "Focus tendency",
      detail: "Usually strongest in quiet evening blocks",
    },
  ];

  return (
    <section className="ai-layer-soft rounded-[1.75rem] p-4">
      <div className="flex items-start gap-3">
        <span className="ai-float flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-cyan-200">
          <Brain className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
            AI reading signals
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{observation}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {signals.map((signal) => {
          const Icon = signal.icon;
          return (
            <div key={signal.label} className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-emerald-200/80" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{signal.label}</p>
                <p className="text-xs text-muted-foreground">{signal.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ReadingPage() {
  const preferences = useUserPreferences();
  const { data: remoteInputs = DEFAULT_READING_INPUTS } = useReadingQuery();
  const saveReadingMutation = useSaveReadingMutation();

  const [draft, setDraft] = useState<ReadingInputs>(remoteInputs);
  const draftRef = useRef(draft);
  const [editingSection, setEditingSection] = useState<"current" | "queue" | null>(
    null,
  );
  const [quickCurrentPage, setQuickCurrentPage] = useState(
    remoteInputs.current.currentPage,
  );

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!editingSection) {
      setDraft(remoteInputs);
      draftRef.current = remoteInputs;
    }
  }, [editingSection, remoteInputs]);

  useEffect(() => {
    if (editingSection !== "current") {
      setQuickCurrentPage(remoteInputs.current.currentPage);
    }
  }, [editingSection, remoteInputs.current.currentPage]);

  const stats = useMemo(() => {
    const plan = inputsToPlan(draft);
    return getReadingStats(plan);
  }, [draft]);
  const hasCurrentPendingChanges = useMemo(
    () =>
      JSON.stringify({
        current: {
          title: draft.current.title,
          author: draft.current.author,
          totalPages: draft.current.totalPages,
        },
        dailyGoalPages: draft.dailyGoalPages,
      }) !==
      JSON.stringify({
        current: {
          title: remoteInputs.current.title,
          author: remoteInputs.current.author,
          totalPages: remoteInputs.current.totalPages,
        },
        dailyGoalPages: remoteInputs.dailyGoalPages,
      }),
    [
      draft.current.author,
      draft.current.title,
      draft.current.totalPages,
      draft.dailyGoalPages,
      remoteInputs.current.author,
      remoteInputs.current.title,
      remoteInputs.current.totalPages,
      remoteInputs.dailyGoalPages,
    ],
  );
  const hasQueuePendingChanges = useMemo(
    () => JSON.stringify(draft.upNext) !== JSON.stringify(remoteInputs.upNext),
    [draft.upNext, remoteInputs.upNext],
  );
  const currentPageDirty = quickCurrentPage !== remoteInputs.current.currentPage;
  const displayedStreak = getDisplayedReadingStreak(
    draft.streak ?? 0,
    draft.lastReadDate,
    getLocalDateKey(),
  );

  function updateDraft(updater: (prev: ReadingInputs) => ReadingInputs) {
    setDraft((prev) => updater(prev));
  }

  function commitNow(next: ReadingInputs) {
    setDraft(next);
    draftRef.current = next;
    saveReadingMutation.mutate({ value: next, previousInputs: remoteInputs });
  }

  function handleStartEditing(section: "current" | "queue") {
    setDraft(remoteInputs);
    draftRef.current = remoteInputs;
    setEditingSection(section);
  }

  function handleCancelEditing() {
    setDraft(remoteInputs);
    draftRef.current = remoteInputs;
    setEditingSection(null);
  }

  function handleSaveChanges() {
    const next = draftRef.current;
    saveReadingMutation.mutate(
      { value: next, previousInputs: remoteInputs },
      {
        onSuccess: (saved) => {
          setDraft(saved);
          draftRef.current = saved;
          setEditingSection(null);
        },
      },
    );
  }

  function handleQuickCurrentPageChange(value: string) {
    if (!canAcceptDigitsOrBlank(value)) return;
    setQuickCurrentPage(value);
  }

  function handleSaveCurrentPage() {
    if (!currentPageDirty) return;

    const next = {
      ...remoteInputs,
      current: {
        ...remoteInputs.current,
        currentPage: quickCurrentPage,
      },
    };

    commitNow(next);
  }

  function updateField(path: ReadingFieldPath, value: string) {
    const digitOnlyPaths: ReadingFieldPath[] = [
      "current.totalPages",
      "dailyGoalPages",
    ];

    if (digitOnlyPaths.includes(path) && !canAcceptDigitsOrBlank(value)) return;

    updateDraft((prev) => {
      if (path === "current.title") {
        return { ...prev, current: { ...prev.current, title: value } };
      }

      if (path === "current.author") {
        return { ...prev, current: { ...prev.current, author: value } };
      }

      if (path === "current.currentPage") {
        return {
          ...prev,
          current: { ...prev.current, currentPage: value },
        };
      }

      if (path === "current.totalPages") {
        return { ...prev, current: { ...prev.current, totalPages: value } };
      }

      if (path === "dailyGoalPages") {
        return { ...prev, dailyGoalPages: value };
      }

      return prev;
    });
  }

  function addToQueue(book: { title: string; author: string; totalPages: string }) {
    updateDraft((prev) => ({ ...prev, upNext: [...prev.upNext, book] }));
  }

  function removeFromQueue(index: number) {
    updateDraft((prev) => ({
      ...prev,
      upNext: prev.upNext.filter((_, i) => i !== index),
    }));
  }

  function reorderQueue(newQueue: ReadingInputs["upNext"]) {
    updateDraft((prev) => ({ ...prev, upNext: newQueue }));
  }

  function markCurrentCompleted() {
    const next = (() => {
      const finishedAt = new Date().toISOString();
      const totalPagesNum = Math.max(
        1,
        parseInt(draft.current.totalPages || "0", 10) || 0,
      );

      const completedBook = {
        title: draft.current.title,
        author: draft.current.author,
        totalPages: totalPagesNum,
        finishedAt,
      };

      const [upNextBook, ...rest] = draft.upNext;
      const nextCurrent = upNextBook
        ? {
            title: upNextBook.title,
            author: upNextBook.author,
            currentPage: "0",
            totalPages: upNextBook.totalPages,
          }
        : { title: "", author: "", currentPage: "", totalPages: "" };

      return {
        ...draft,
        current: nextCurrent,
        upNext: rest,
        completed: [completedBook, ...draft.completed],
      };
    })();

    commitNow(next);
  }

  function resetAll() {
    commitNow(DEFAULT_READING_INPUTS);
  }

  return (
    <div className="relative -mx-4 -mt-6 min-h-[calc(100vh-5rem)] overflow-hidden px-4 pb-10 pt-6 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_4%,rgba(245,158,11,0.13),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(34,211,238,0.10),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent_42%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[min(46rem,92vw)] -translate-x-1/2 rounded-full bg-amber-200/5 blur-3xl" />

      <div className="mx-auto max-w-7xl space-y-8">
        <section className="ai-motion-enter flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/24 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
              Personal reading operating system
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">
              Reading that compounds into trajectory.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              A quieter space for momentum, immersion, and the ideas currently shaping your next version.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full bg-background/20 px-4 py-2 text-sm text-muted-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.045)]">
            <Flame className="h-4 w-4 text-amber-200" />
            <span className="font-medium text-foreground">{displayedStreak}</span>
            <span>day rhythm</span>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:items-start">
          <div className="space-y-8">
        <ReadingNowCard
          stats={stats}
          onMarkCompleted={markCurrentCompleted}
          onReset={resetAll}
          isEditing={editingSection === "current"}
          isSaving={saveReadingMutation.isPending}
          hasPendingChanges={hasCurrentPendingChanges}
          onStartEditing={() => handleStartEditing("current")}
          onSave={handleSaveChanges}
          onCancel={handleCancelEditing}
          currentPageValue={quickCurrentPage}
          onCurrentPageChange={handleQuickCurrentPageChange}
          onSaveCurrentPage={handleSaveCurrentPage}
          currentPageDirty={currentPageDirty}
          titleValue={draft.current.title}
          authorValue={draft.current.author}
          totalPagesValue={draft.current.totalPages}
          dailyGoalValue={draft.dailyGoalPages}
          onTitleChange={(value) => updateField("current.title", value)}
          onAuthorChange={(value) => updateField("current.author", value)}
          onTotalPagesChange={(value) => updateField("current.totalPages", value)}
          onDailyGoalChange={(value) => updateField("dailyGoalPages", value)}
          controlsDisabled={editingSection === "queue"}
        />

            <div className="hidden lg:block">
              <CompletedBooksSection books={draft.completed} preferences={preferences} />
            </div>
          </div>

          <div className="space-y-8 lg:pt-10">
            <ReadingSignals
              displayedStreak={displayedStreak}
              lastReadDate={draft.lastReadDate}
              pct={stats.pct}
              pagesLeft={stats.pagesLeft}
              dailyGoalPages={stats.dailyGoalPages}
              queueCount={draft.upNext.length}
            />

            <ReadingNextCard
              queue={draft.upNext}
              onRemove={removeFromQueue}
              onReorder={reorderQueue}
              onAdd={addToQueue}
              editable={editingSection === "queue"}
              isSaving={saveReadingMutation.isPending}
              hasPendingChanges={hasQueuePendingChanges}
              onStartEditing={() => handleStartEditing("queue")}
              onSave={handleSaveChanges}
              onCancel={handleCancelEditing}
              controlsDisabled={editingSection === "current"}
            />

            <div className="lg:hidden">
              <CompletedBooksSection books={draft.completed} preferences={preferences} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
