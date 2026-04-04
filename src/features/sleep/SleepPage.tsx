import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LoaderCircle, Moon, RotateCcw, Save } from "lucide-react";
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
  createEmptySleepRecoveryEntry,
  hasSleepRecoveryContent,
  type SleepEnergyLevel,
  type SleepRecoveryEntry,
} from "./sleepTypes";
import {
  useRecentSleepHistoryQuery,
  useSaveSleepEntryMutation,
  useSleepEntryQuery,
} from "./useSleepQuery";

type SleepDraft = {
  hours: string;
  minutes: string;
  sleepQualityScore: string;
  bedtime: string;
  wakeTime: string;
  energyLevel: SleepEnergyLevel | null;
  notes: string;
};

const ENERGY_LEVELS: Array<{
  value: SleepEnergyLevel;
  label: string;
  description: string;
}> = [
  { value: 1, label: "1", description: "Drained" },
  { value: 2, label: "2", description: "Low" },
  { value: 3, label: "3", description: "Steady" },
  { value: 4, label: "4", description: "Good" },
  { value: 5, label: "5", description: "Great" },
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

function toDraft(entry: SleepRecoveryEntry): SleepDraft {
  const totalMinutes = entry.sleepDurationMinutes;

  return {
    hours: totalMinutes === null ? "" : String(Math.floor(totalMinutes / 60)),
    minutes: totalMinutes === null ? "" : String(totalMinutes % 60),
    sleepQualityScore:
      entry.sleepQualityScore === null ? "" : String(entry.sleepQualityScore),
    bedtime: entry.bedtime ?? "",
    wakeTime: entry.wakeTime ?? "",
    energyLevel: entry.energyLevel,
    notes: entry.notes ?? "",
  };
}

function areDraftsEqual(left: SleepDraft, right: SleepDraft): boolean {
  return (
    left.hours === right.hours &&
    left.minutes === right.minutes &&
    left.sleepQualityScore === right.sleepQualityScore &&
    left.bedtime === right.bedtime &&
    left.wakeTime === right.wakeTime &&
    left.energyLevel === right.energyLevel &&
    left.notes === right.notes
  );
}

function buildEntryFromDraft(
  baseEntry: SleepRecoveryEntry,
  draft: SleepDraft,
): { entry?: SleepRecoveryEntry; error?: string } {
  const parsedDuration = parseSleepDurationMinutes(draft.hours, draft.minutes);
  if (typeof parsedDuration === "string") {
    return { error: parsedDuration };
  }

  const parsedQuality = parseSleepQualityScore(draft.sleepQualityScore);
  if (typeof parsedQuality === "string") {
    return { error: parsedQuality };
  }

  const entry: SleepRecoveryEntry = {
    ...baseEntry,
    sleepDurationMinutes: parsedDuration,
    sleepQualityScore: parsedQuality,
    bedtime: normalizeTimeInput(draft.bedtime),
    wakeTime: normalizeTimeInput(draft.wakeTime),
    energyLevel: draft.energyLevel,
    notes: normalizeNotes(draft.notes),
  };

  if (!hasSleepRecoveryContent(entry)) {
    return { error: "Add at least one sleep detail before saving." };
  }

  return { entry };
}

function parseSleepDurationMinutes(
  hoursValue: string,
  minutesValue: string,
): number | null | string {
  const trimmedHours = hoursValue.trim();
  const trimmedMinutes = minutesValue.trim();

  if (!trimmedHours && !trimmedMinutes) {
    return null;
  }

  if (trimmedHours && !/^\d+$/.test(trimmedHours)) {
    return "Sleep hours must be a whole number.";
  }

  if (trimmedMinutes && !/^\d+$/.test(trimmedMinutes)) {
    return "Sleep minutes must be a whole number.";
  }

  const hours = trimmedHours ? Number(trimmedHours) : 0;
  const minutes = trimmedMinutes ? Number(trimmedMinutes) : 0;

  if (minutes < 0 || minutes > 59) {
    return "Sleep minutes must be between 0 and 59.";
  }

  const total = hours * 60 + minutes;
  if (total <= 0 || total > 1440) {
    return "Sleep duration must be between 1 minute and 24 hours.";
  }

  return total;
}

function parseSleepQualityScore(value: string): number | null | string {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!/^\d+$/.test(trimmed)) {
    return "Sleep quality must be a whole number between 0 and 100.";
  }

  const parsed = Number(trimmed);
  if (parsed < 0 || parsed > 100) {
    return "Sleep quality must be between 0 and 100.";
  }

  return parsed;
}

function normalizeTimeInput(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeNotes(value: string): string | null {
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

function formatSleepDuration(totalMinutes: number | null): string {
  if (totalMinutes === null) return "Not logged";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getEnergyLabel(level: SleepEnergyLevel | null): string {
  if (level === null) return "Not logged";

  const match = ENERGY_LEVELS.find((option) => option.value === level);
  return match ? `${match.value}/5 ${match.description}` : `${level}/5`;
}

function toBedtimeMinutes(value: string | null): number | null {
  if (!value) return null;
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  const raw = hours * 60 + minutes;
  return hours < 12 ? raw + 24 * 60 : raw;
}

function formatMinutesAsTime(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getSleepHistorySummary(entries: SleepRecoveryEntry[]) {
  const durations = entries
    .map((entry) => entry.sleepDurationMinutes)
    .filter((value): value is number => value !== null);
  const qualityScores = entries
    .map((entry) => entry.sleepQualityScore)
    .filter((value): value is number => value !== null);
  const bedtimes = entries
    .map((entry) => toBedtimeMinutes(entry.bedtime))
    .filter((value): value is number => value !== null);

  const averageDuration =
    durations.length > 0
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : null;
  const averageQuality =
    qualityScores.length > 0
      ? Math.round(
          qualityScores.reduce((sum, value) => sum + value, 0) /
            qualityScores.length,
        )
      : null;

  let bedtimeWindow: string | null = null;
  if (bedtimes.length >= 2) {
    const earliest = Math.min(...bedtimes);
    const latest = Math.max(...bedtimes);
    bedtimeWindow = `${formatMinutesAsTime(earliest)} - ${formatMinutesAsTime(
      latest,
    )}`;
  } else if (bedtimes.length === 1) {
    bedtimeWindow = formatMinutesAsTime(bedtimes[0]);
  }

  return {
    averageDuration,
    averageQuality,
    bedtimeWindow,
  };
}

export default function SleepPage() {
  const { userId, authReady } = useAuth();
  const today = useTodayDate();
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey());
  const sleepEntryQuery = useSleepEntryQuery(selectedDate);
  const sleepHistoryQuery = useRecentSleepHistoryQuery(7);
  const saveSleepEntryMutation = useSaveSleepEntryMutation();

  const hydratedEntry = useMemo(
    () =>
      sleepEntryQuery.data ??
      createEmptySleepRecoveryEntry(userId ?? "", selectedDate),
    [selectedDate, sleepEntryQuery.data, userId],
  );

  const [draft, setDraft] = useState<SleepDraft>(() => toDraft(hydratedEntry));
  const [formError, setFormError] = useState<string | null>(null);

  const hydrationKey = sleepEntryQuery.data
    ? `${sleepEntryQuery.data.logDate}:${sleepEntryQuery.data.updatedAt}`
    : `empty:${userId ?? "anon"}:${selectedDate}`;

  useEffect(() => {
    setDraft(toDraft(hydratedEntry));
    setFormError(null);
  }, [hydrationKey, hydratedEntry]);

  const entryExists = hasSleepRecoveryContent(hydratedEntry);
  const savedDraft = toDraft(hydratedEntry);
  const isDirty = !areDraftsEqual(draft, savedDraft);
  const isLoadingEntry =
    !authReady || (sleepEntryQuery.isLoading && !sleepEntryQuery.data);
  const isSaving = saveSleepEntryMutation.isPending;
  const selectedDateLabel = formatSelectedDate(selectedDate);
  const loadError =
    sleepEntryQuery.error instanceof Error
      ? sleepEntryQuery.error.message
      : "Couldn't load this sleep entry.";
  const recentEntries = sleepHistoryQuery.data ?? [];
  const sleepHistorySummary = useMemo(
    () => getSleepHistorySummary(recentEntries),
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
      await saveSleepEntryMutation.mutateAsync({ value: built.entry });
      toast.success(entryExists ? "Sleep entry updated" : "Sleep entry saved");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't save your sleep entry.";
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
          title="Sleep / Recovery"
          description="Log one sleep entry per day and keep your nightly routine in one simple, consistent place."
          icon={<Moon className="h-5 w-5 text-indigo-500" />}
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

      {sleepEntryQuery.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Couldn&apos;t load this sleep entry</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                void sleepEntryQuery.refetch();
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

      {!sleepEntryQuery.isError ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Daily sleep log</CardTitle>
                    <CardDescription>{selectedDateLabel}</CardDescription>
                  </div>

                  <Badge variant={entryExists ? "secondary" : "outline"}>
                    {entryExists ? "Saved entry" : "Not logged yet"}
                  </Badge>
                </div>

                {!entryExists && !isLoadingEntry ? (
                  <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3">
                    <p className="text-sm font-medium">
                      No sleep entry for this date yet.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add the details you want to track, then save once to create
                      the entry.
                    </p>
                  </div>
                ) : null}
              </CardHeader>

              <CardContent>
                {isLoadingEntry ? (
                  <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Loading sleep entry...
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <FieldLabel hint="Split it into hours and minutes for a quicker mobile edit.">
                          Sleep duration
                        </FieldLabel>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <Input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Hours"
                            value={draft.hours}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                hours: event.target.value,
                              }))
                            }
                            disabled={isSaving}
                          />
                          <Input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Minutes"
                            value={draft.minutes}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                minutes: event.target.value,
                              }))
                            }
                            disabled={isSaving}
                          />
                        </div>
                      </div>

                      <div>
                        <FieldLabel hint="Optional score from 0 to 100.">
                          Sleep quality
                        </FieldLabel>
                        <Input
                          className="mt-2"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0-100"
                          value={draft.sleepQualityScore}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              sleepQualityScore: event.target.value,
                            }))
                          }
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel hint="Optional. Use your usual bedtime.">
                          Bedtime
                        </FieldLabel>
                        <Input
                          className="mt-2"
                          type="time"
                          value={draft.bedtime}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              bedtime: event.target.value,
                            }))
                          }
                          disabled={isSaving}
                        />
                      </div>

                      <div>
                        <FieldLabel hint="Optional. Log when you actually woke up.">
                          Wake time
                        </FieldLabel>
                        <Input
                          className="mt-2"
                          type="time"
                          value={draft.wakeTime}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              wakeTime: event.target.value,
                            }))
                          }
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <FieldLabel hint="How did you feel after waking up?">
                        Energy level
                      </FieldLabel>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {ENERGY_LEVELS.map((option) => {
                          const isActive = draft.energyLevel === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setDraft((current) => ({
                                  ...current,
                                  energyLevel:
                                    current.energyLevel === option.value
                                      ? null
                                      : option.value,
                                }))
                              }
                              className={cn(
                                "rounded-xl border px-1.5 py-2.5 text-center transition-colors sm:px-2 sm:py-3",
                                isActive
                                  ? "border-indigo-500 bg-indigo-500/10 text-foreground"
                                  : "border-border bg-background hover:border-indigo-300 hover:bg-muted/40",
                              )}
                              aria-pressed={isActive}
                              disabled={isSaving}
                            >
                              <div className="text-sm font-semibold">
                                {option.label}
                              </div>
                              <div className="mt-1 hidden text-[11px] text-muted-foreground sm:block">
                                {option.description}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <FieldLabel hint="Optional context like caffeine, stress, late meals, or disrupted sleep.">
                        Notes
                      </FieldLabel>
                      <Textarea
                        className="mt-2 min-h-[120px]"
                        placeholder="Anything that might explain how this night felt?"
                        value={draft.notes}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            notes: event.target.value,
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
                            : "Save sleep entry"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Saved snapshot</CardTitle>
                  <CardDescription>
                    A quick view of the current entry for{" "}
                    {selectedDateLabel.toLowerCase()}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SummaryRow
                    label="Duration"
                    value={formatSleepDuration(hydratedEntry.sleepDurationMinutes)}
                  />
                  <SummaryRow
                    label="Quality"
                    value={
                      hydratedEntry.sleepQualityScore === null
                        ? "Not logged"
                        : `${hydratedEntry.sleepQualityScore}/100`
                    }
                  />
                  <SummaryRow
                    label="Bedtime"
                    value={hydratedEntry.bedtime ?? "Not logged"}
                  />
                  <SummaryRow
                    label="Wake time"
                    value={hydratedEntry.wakeTime ?? "Not logged"}
                  />
                  <SummaryRow
                    label="Energy"
                    value={getEnergyLabel(hydratedEntry.energyLevel)}
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
                    A simple summary of your last 7 logged nights.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sleepHistoryQuery.isLoading && recentEntries.length === 0 ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Loading recent sleep history...
                    </div>
                  ) : recentEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Save a few nights and this area will start showing your
                      recent patterns.
                    </p>
                  ) : (
                    <>
                      <SummaryRow
                        label="Average duration"
                        value={formatSleepDuration(
                          sleepHistorySummary.averageDuration,
                        )}
                      />
                      <SummaryRow
                        label="Average quality"
                        value={
                          sleepHistorySummary.averageQuality === null
                            ? "Not enough data"
                            : `${sleepHistorySummary.averageQuality}/100`
                        }
                      />
                      <SummaryRow
                        label="Bedtime window"
                        value={
                          sleepHistorySummary.bedtimeWindow ?? "Not enough data"
                        }
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent sleep history</CardTitle>
              <CardDescription>
                A clear look at your last 7 logged nights without adding chart
                noise.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sleepHistoryQuery.isLoading && recentEntries.length === 0 ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Loading recent sleep history...
                </div>
              ) : recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No sleep history yet. Your recent nights will show up here
                  after your first few entries.
                </p>
              ) : (
                recentEntries.map((entry) => (
                  <div
                    key={entry.logDate}
                    className="rounded-xl border bg-muted/20 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {formatShortDate(entry.logDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.bedtime && entry.wakeTime
                            ? `${entry.bedtime} to ${entry.wakeTime}`
                            : entry.bedtime
                              ? `Bedtime ${entry.bedtime}`
                              : entry.wakeTime
                                ? `Wake time ${entry.wakeTime}`
                                : "Times not logged"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">
                          {formatSleepDuration(entry.sleepDurationMinutes)}
                        </Badge>
                        <Badge variant="outline">
                          {entry.sleepQualityScore !== null
                            ? `Quality ${entry.sleepQualityScore}`
                            : "No quality"}
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
        </>
      ) : null}
    </PageScaffold>
  );
}
