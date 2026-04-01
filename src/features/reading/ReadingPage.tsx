import { useEffect, useMemo, useRef, useState } from "react";
import type { CompletedBook, ReadingFieldPath, ReadingInputs } from "./readingTypes";
import {
  canAcceptDigitsOrBlank,
  getReadingStats,
  getDisplayedReadingStreak,
  inputsToPlan,
} from "./readingUtils";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { Flame, BookOpen } from "lucide-react";
import { ReadingNowCard } from "./components/ReadingNowCard";
import { ReadingNextCard } from "./components/ReadingNextCard";
import { DEFAULT_READING_INPUTS } from "./readingStorage";
import { useReadingQuery, useSaveReadingMutation } from "./useReadingQuery";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-3">
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

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {books.map((b, idx) => {
          const date = new Date(b.finishedAt);
          const monthYear = formatDateWithPreferences(date, preferences, {
            month: "short",
            year: "numeric",
          });
          const medal =
            idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "📖";

          return (
            <div
              key={`${b.finishedAt}-${idx}`}
              className="group relative overflow-hidden rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 transition-colors hover:bg-amber-500/10"
            >
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
                    <span className="text-[10px] text-muted-foreground/40">
                      ·
                    </span>
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
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
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

      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div
              className={[
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                displayedStreak > 0 ? "bg-orange-500/15" : "bg-muted",
              ].join(" ")}
            >
              <Flame
                className={[
                  "h-6 w-6",
                  displayedStreak > 0
                    ? "text-orange-500"
                    : "text-muted-foreground",
                ].join(" ")}
              />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {displayedStreak}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  day streak
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {displayedStreak === 0
                  ? "Update your page count to start a streak"
                  : draft.lastReadDate === getLocalDateKey()
                    ? "You read today — keep it up! 🔥"
                    : "Update today's pages to keep your streak"}
              </p>
            </div>
          </CardContent>
        </Card>

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
  );
}
