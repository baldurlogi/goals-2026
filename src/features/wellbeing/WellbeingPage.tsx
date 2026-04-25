import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BookOpenText, Heart, LoaderCircle, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/authContext";
import { getLocalDateKey, useTodayDate } from "@/hooks/useTodayDate";
import { cn } from "@/lib/utils";
import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptyMentalWellbeingEntry,
  hasMentalWellbeingContent,
  type MentalWellbeingEntry,
  type WellbeingScaleValue,
} from "./wellbeingTypes";
import {
  useMentalWellbeingEntryQuery,
  useRecentMentalWellbeingHistoryQuery,
  useSaveMentalWellbeingEntryMutation,
} from "./useWellbeingQuery";

type WellbeingDraft = {
  moodScore: WellbeingScaleValue | null;
  stressLevel: WellbeingScaleValue | null;
  energyLevel: WellbeingScaleValue | null;
  journalEntry: string;
  gratitudeEntry: string;
};

const MOOD_OPTIONS: Array<{
  value: WellbeingScaleValue;
  label: string;
  description: string;
}> = [
  { value: 1, label: "1", description: "Rough" },
  { value: 2, label: "2", description: "Low" },
  { value: 3, label: "3", description: "Okay" },
  { value: 4, label: "4", description: "Good" },
  { value: 5, label: "5", description: "Great" },
];

const SUPPORT_OPTIONS: Array<{
  value: WellbeingScaleValue;
  label: string;
  description: string;
}> = [
  { value: 1, label: "1", description: "Very low" },
  { value: 2, label: "2", description: "Low" },
  { value: 3, label: "3", description: "Steady" },
  { value: 4, label: "4", description: "Good" },
  { value: 5, label: "5", description: "High" },
];

function FieldLabel({
  children,
  hint,
}: {
  children: string;
  hint?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-sm font-medium">{children}</span>
      {hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function RatingGroup({
  label,
  hint,
  value,
  options,
  onChange,
  allowClear = true,
}: {
  label: string;
  hint?: string;
  value: WellbeingScaleValue | null;
  options: Array<{
    value: WellbeingScaleValue;
    label: string;
    description: string;
  }>;
  onChange: (value: WellbeingScaleValue | null) => void;
  allowClear?: boolean;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {options.map((option) => {
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange(
                  allowClear && isActive ? null : option.value,
                )
              }
              className={cn(
                "rounded-xl border px-1.5 py-2.5 text-center transition-colors sm:px-2 sm:py-3",
                isActive
                  ? "border-pink-500 bg-pink-500/10 text-foreground"
                  : "border-border bg-background hover:border-pink-300 hover:bg-muted/40",
              )}
              aria-pressed={isActive}
            >
              <div className="text-sm font-semibold">{option.label}</div>
              <div className="mt-1 hidden text-[11px] text-muted-foreground sm:block">
                {option.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function toDraft(entry: MentalWellbeingEntry): WellbeingDraft {
  return {
    moodScore: entry.moodScore,
    stressLevel: entry.stressLevel,
    energyLevel: entry.energyLevel,
    journalEntry: entry.journalEntry ?? "",
    gratitudeEntry: entry.gratitudeEntry ?? "",
  };
}

function areDraftsEqual(left: WellbeingDraft, right: WellbeingDraft): boolean {
  return (
    left.moodScore === right.moodScore &&
    left.stressLevel === right.stressLevel &&
    left.energyLevel === right.energyLevel &&
    left.journalEntry === right.journalEntry &&
    left.gratitudeEntry === right.gratitudeEntry
  );
}

function buildEntryFromDraft(
  baseEntry: MentalWellbeingEntry,
  draft: WellbeingDraft,
): { entry?: MentalWellbeingEntry; error?: string } {
  if (draft.moodScore === null) {
    return { error: "Pick the mood that feels closest today before saving." };
  }

  const journalEntry = normalizeOptionalText(draft.journalEntry);
  const gratitudeEntry = normalizeOptionalText(draft.gratitudeEntry);

  if (!journalEntry && !gratitudeEntry) {
    return {
      error: "Add a short reflection or gratitude note so the check-in feels useful later.",
    };
  }

  return {
    entry: {
      ...baseEntry,
      moodScore: draft.moodScore,
      stressLevel: draft.stressLevel,
      energyLevel: draft.energyLevel,
      journalEntry,
      gratitudeEntry,
    },
  };
}

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatSelectedDate(dateKey: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function formatShortDate(dateKey: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function formatUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function getScaleLabel(
  value: WellbeingScaleValue | null,
  options: Array<{
    value: WellbeingScaleValue;
    label: string;
    description: string;
  }>,
): string {
  if (value === null) return "Not logged";

  const match = options.find((option) => option.value === value);
  return match ? `${match.value}/5 ${match.description}` : `${value}/5`;
}

function getWellbeingHistorySummary(entries: MentalWellbeingEntry[]) {
  const moods = entries
    .map((entry) => entry.moodScore)
    .filter((value): value is WellbeingScaleValue => value !== null);
  const stressLevels = entries
    .map((entry) => entry.stressLevel)
    .filter((value): value is WellbeingScaleValue => value !== null);
  const journalDays = entries.filter(
    (entry) => (entry.journalEntry?.trim() ?? "") !== "",
  ).length;

  const averageMood =
    moods.length > 0
      ? Number(
          (
            moods.reduce((sum, value) => sum + value, 0) / moods.length
          ).toFixed(1),
        )
      : null;
  const averageStress =
    stressLevels.length > 0
      ? Number(
          (
            stressLevels.reduce((sum, value) => sum + value, 0) /
            stressLevels.length
          ).toFixed(1),
        )
      : null;

  return {
    averageMood,
    averageStress,
    journalDays,
  };
}

function getEntryPresenceLabel(value: string | null): string {
  return value ? "Added" : "Not added";
}

function truncateNotebookText(value: string, maxLength = 220): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

function hasNotebookContent(entry: MentalWellbeingEntry): boolean {
  return (
    (entry.journalEntry?.trim() ?? "") !== "" ||
    (entry.gratitudeEntry?.trim() ?? "") !== ""
  );
}

function getNotebookEntries(entries: MentalWellbeingEntry[]) {
  return entries.filter(hasNotebookContent);
}

export default function WellbeingPage() {
  const { userId, authReady } = useAuth();
  const today = useTodayDate();
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey());
  const wellbeingEntryQuery = useMentalWellbeingEntryQuery(selectedDate);
  const wellbeingHistoryQuery = useRecentMentalWellbeingHistoryQuery(7);
  const wellbeingNotebookQuery = useRecentMentalWellbeingHistoryQuery(60);
  const saveWellbeingMutation = useSaveMentalWellbeingEntryMutation();

  const hydratedEntry = useMemo(
    () =>
      wellbeingEntryQuery.data ??
      createEmptyMentalWellbeingEntry(userId ?? "", selectedDate),
    [selectedDate, wellbeingEntryQuery.data, userId],
  );

  const [draft, setDraft] = useState<WellbeingDraft>(() => toDraft(hydratedEntry));
  const [formError, setFormError] = useState<string | null>(null);

  const hydrationKey = wellbeingEntryQuery.data
    ? `${wellbeingEntryQuery.data.logDate}:${wellbeingEntryQuery.data.updatedAt}`
    : `empty:${userId ?? "anon"}:${selectedDate}`;

  useEffect(() => {
    setDraft(toDraft(hydratedEntry));
    setFormError(null);
  }, [hydrationKey, hydratedEntry]);

  const entryExists = hasMentalWellbeingContent(hydratedEntry);
  const savedDraft = toDraft(hydratedEntry);
  const isDirty = !areDraftsEqual(draft, savedDraft);
  const isLoadingEntry =
    !authReady || (wellbeingEntryQuery.isLoading && !wellbeingEntryQuery.data);
  const isSaving = saveWellbeingMutation.isPending;
  const selectedDateLabel = formatSelectedDate(selectedDate);
  const loadError =
    wellbeingEntryQuery.error instanceof Error
      ? wellbeingEntryQuery.error.message
      : "Couldn't load this wellbeing check-in.";
  const recentEntries = wellbeingHistoryQuery.data ?? [];
  const notebookEntries = useMemo(
    () => getNotebookEntries(wellbeingNotebookQuery.data ?? []),
    [wellbeingNotebookQuery.data],
  );
  const wellbeingHistorySummary = useMemo(
    () => getWellbeingHistorySummary(recentEntries),
    [recentEntries],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const built = buildEntryFromDraft(hydratedEntry, draft);
    if (!built.entry) {
      setFormError(built.error ?? "Please review the form.");
      toast.error(built.error ?? "Please review the form.");
      return;
    }

    setFormError(null);

    try {
      await saveWellbeingMutation.mutateAsync({ value: built.entry });
      toast.success(entryExists ? "Check-in updated" : "Check-in saved");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't save your wellbeing check-in.";
      setFormError(message);
      toast.error(message);
    }
  }

  function handleReset() {
    setDraft(savedDraft);
    setFormError(null);
  }

  return (
    <PageScaffold width="wide" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Mental Wellbeing"
          description="A light daily check-in for mood, stress, energy, and a short reflection you can actually keep up with."
          icon={<Heart className="h-5 w-5 text-pink-500" />}
        />

        <div className="w-full max-w-full space-y-1 sm:max-w-[220px]">
          <FieldLabel children="Selected date" />
          <Input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(event) => setSelectedDate(event.target.value || today)}
            disabled={isSaving}
          />
        </div>
      </div>

      {wellbeingEntryQuery.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Couldn&apos;t load this check-in</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                void wellbeingEntryQuery.refetch();
              }}
            >
              Try again
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSelectedDate(today);
              }}
            >
              Jump to today
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!wellbeingEntryQuery.isError ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Daily check-in</CardTitle>
                    <CardDescription>{selectedDateLabel}</CardDescription>
                  </div>

                  <Badge variant={entryExists ? "secondary" : "outline"}>
                    {entryExists ? "Saved check-in" : "Not checked in yet"}
                  </Badge>
                </div>

                {!entryExists && !isLoadingEntry ? (
                  <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3">
                    <p className="text-sm font-medium">
                      No check-in for this date yet.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Keep it simple: choose your mood, add a quick note, and save.
                    </p>
                  </div>
                ) : null}
              </CardHeader>

              <CardContent>
                {isLoadingEntry ? (
                  <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Loading daily check-in...
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <RatingGroup
                      label="How are you feeling overall?"
                      hint="Pick the one that feels closest. It doesn&apos;t have to be perfect."
                      value={draft.moodScore}
                      options={MOOD_OPTIONS}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, moodScore: value }))
                      }
                      allowClear={false}
                    />

                    <div className="grid gap-5 lg:grid-cols-2">
                      <RatingGroup
                        label="Stress level"
                        hint="Optional. A quick sense-check for the day."
                        value={draft.stressLevel}
                        options={SUPPORT_OPTIONS}
                        onChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            stressLevel: value,
                          }))
                        }
                      />

                      <RatingGroup
                        label="Energy level"
                        hint="Optional. Helpful when you look back later."
                        value={draft.energyLevel}
                        options={SUPPORT_OPTIONS}
                        onChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            energyLevel: value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel hint="A short reflection is enough. One or two sentences works well.">
                        Journal
                      </FieldLabel>
                      <Textarea
                        className="mt-2 min-h-[120px]"
                        placeholder="What feels most true about today so far?"
                        value={draft.journalEntry}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            journalEntry: event.target.value,
                          }))
                        }
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <FieldLabel hint="Optional. Keep it small and real.">
                        Gratitude
                      </FieldLabel>
                      <Textarea
                        className="mt-2 min-h-[90px]"
                        placeholder="Anything you&apos;re glad was part of today?"
                        value={draft.gratitudeEntry}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            gratitudeEntry: event.target.value,
                          }))
                        }
                        disabled={isSaving}
                      />
                    </div>

                    {formError ? (
                      <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        {formError}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleReset}
                        disabled={!isDirty || isSaving}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset changes
                      </Button>

                      <Button type="submit" disabled={!isDirty || isSaving}>
                        {isSaving ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isSaving
                          ? "Saving..."
                          : entryExists
                            ? "Save changes"
                            : "Save check-in"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today at a glance</CardTitle>
                  <CardDescription>
                    A simple snapshot of the current entry for {selectedDateLabel.toLowerCase()}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SummaryRow
                    label="Mood"
                    value={getScaleLabel(hydratedEntry.moodScore, MOOD_OPTIONS)}
                  />
                  <SummaryRow
                    label="Stress"
                    value={getScaleLabel(hydratedEntry.stressLevel, SUPPORT_OPTIONS)}
                  />
                  <SummaryRow
                    label="Energy"
                    value={getScaleLabel(hydratedEntry.energyLevel, SUPPORT_OPTIONS)}
                  />
                  <SummaryRow
                    label="Reflection"
                    value={getEntryPresenceLabel(hydratedEntry.journalEntry)}
                  />
                  <SummaryRow
                    label="Gratitude"
                    value={getEntryPresenceLabel(hydratedEntry.gratitudeEntry)}
                  />
                  <SummaryRow
                    label="Last updated"
                    value={
                      entryExists
                        ? formatUpdatedAt(hydratedEntry.updatedAt)
                        : "Not saved yet"
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Trend snapshot</CardTitle>
                  <CardDescription>
                    A simple summary of your last 7 check-ins.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {wellbeingHistoryQuery.isLoading && recentEntries.length === 0 ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Loading recent check-ins...
                    </div>
                  ) : recentEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Save a few check-ins and this area will start showing your
                      recent patterns.
                    </p>
                  ) : (
                    <>
                      <SummaryRow
                        label="Average mood"
                        value={
                          wellbeingHistorySummary.averageMood === null
                            ? "Not enough data"
                            : `${wellbeingHistorySummary.averageMood}/5`
                        }
                      />
                      <SummaryRow
                        label="Average stress"
                        value={
                          wellbeingHistorySummary.averageStress === null
                            ? "Not enough data"
                            : `${wellbeingHistorySummary.averageStress}/5`
                        }
                      />
                      <SummaryRow
                        label="Journaled days"
                        value={`${wellbeingHistorySummary.journalDays}/${recentEntries.length}`}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent wellbeing history</CardTitle>
              <CardDescription>
                A clear look at your last 7 check-ins, including mood,
                stress, and short reflections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {wellbeingHistoryQuery.isLoading && recentEntries.length === 0 ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Loading recent check-ins...
                </div>
              ) : recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No wellbeing history yet. Your recent check-ins will show up
                  here after your first few entries.
                </p>
              ) : (
                recentEntries.map((entry) => (
                  <div
                    key={entry.logDate}
                    className="rounded-xl border bg-muted/20 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {formatShortDate(entry.logDate)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {entry.journalEntry ??
                            entry.gratitudeEntry ??
                            "No reflection added"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">
                          {entry.moodScore !== null
                            ? `Mood ${entry.moodScore}/5`
                            : "No mood"}
                        </Badge>
                        <Badge variant="outline">
                          {entry.stressLevel !== null
                            ? `Stress ${entry.stressLevel}/5`
                            : "No stress"}
                        </Badge>
                        <Badge variant="outline">
                          {entry.energyLevel !== null
                            ? `Energy ${entry.energyLevel}/5`
                            : "No energy"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpenText className="h-4 w-4 text-pink-500" />
                <CardTitle className="text-lg">Journal notebook</CardTitle>
              </div>
              <CardDescription>
                Your recent reflections and gratitude notes in one place, so you
                can look back through them like a notebook.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {wellbeingNotebookQuery.isLoading && notebookEntries.length === 0 ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Loading notebook entries...
                </div>
              ) : notebookEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No journal notes yet. Once you add reflections or gratitude
                  notes, they&apos;ll build up here like a simple notebook.
                </p>
              ) : (
                notebookEntries.map((entry) => {
                  const hasJournal = (entry.journalEntry?.trim() ?? "") !== "";
                  const hasGratitude = (entry.gratitudeEntry?.trim() ?? "") !== "";

                  return (
                    <button
                      key={entry.logDate}
                      type="button"
                      onClick={() => setSelectedDate(entry.logDate)}
                      className="w-full rounded-xl border bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/35"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">
                              {formatSelectedDate(entry.logDate)}
                            </p>
                            {entry.logDate === selectedDate ? (
                              <Badge variant="secondary">Open day</Badge>
                            ) : null}
                          </div>

                          {hasJournal ? (
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Reflection
                              </p>
                              <p className="text-sm text-foreground/90">
                                {truncateNotebookText(entry.journalEntry ?? "")}
                              </p>
                            </div>
                          ) : null}

                          {hasGratitude ? (
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Gratitude
                              </p>
                              <p className="text-sm text-foreground/90">
                                {truncateNotebookText(entry.gratitudeEntry ?? "", 160)}
                              </p>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">
                            {entry.moodScore !== null
                              ? `Mood ${entry.moodScore}/5`
                              : "No mood"}
                          </Badge>
                          {hasJournal ? (
                            <Badge variant="outline">Journal</Badge>
                          ) : null}
                          {hasGratitude ? (
                            <Badge variant="outline">Gratitude</Badge>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </PageScaffold>
  );
}
