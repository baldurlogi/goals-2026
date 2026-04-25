import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ScheduleLog } from "./scheduleStorage";
import type { TimelineItem } from "./scheduleTypes";
import {
  SCHEDULE_CONFIG,
  getScheduleDayLabel,
  getScheduleDayLabel as getDayLabel,
} from "./scheduleData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimelineList } from "./components/TimelineList";
import { useAuth } from "@/features/auth/authContext";
import { formatTimeStringWithPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";
import { cn } from "@/lib/utils";
import { useTodayDate } from "@/hooks/useTodayDate";
import {
  applyToggleToLog,
  getScheduleDayKeyForDate,
  getScheduleSummary,
  loadScheduleLog,
  loadScheduleTemplates,
  saveDayBlocks,
  seedScheduleLog,
  seedScheduleTemplates,
  toggleBlock,
  SCHEDULE_CHANGED_EVENT,
  SCHEDULE_TEMPLATE_EVENT,
} from "./scheduleStorage";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function parseDateKey(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, amount: number) {
  const next = parseDateKey(dateKey);
  next.setDate(next.getDate() + amount);
  return formatDateKey(next);
}

function getStartOfWeek(dateKey: string) {
  const date = parseDateKey(dateKey);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return formatDateKey(date);
}

function getWeekDates(dateKey: string) {
  const start = getStartOfWeek(dateKey);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function buildEmptyScheduleLog(date: string): ScheduleLog {
  return {
    date,
    dayKey: getScheduleDayKeyForDate(date),
    completed: [],
    totalBlocks: 0,
  };
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
});

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

const RANGE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

const EMOJI_SUGGESTIONS = [
  "⏰",
  "💪",
  "🥣",
  "💻",
  "🥗",
  "🍎",
  "✅",
  "🏋️",
  "🥤",
  "🚿",
  "🍽️",
  "🧠",
  "📝",
  "🌙",
  "📖",
  "🚶",
  "🏃",
  "🏢",
  "🎉",
  "🏠",
  "📅",
];

type BlockFormState = Omit<TimelineItem, "id">;

function BlockModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: TimelineItem;
  onSave: (block: Omit<TimelineItem, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<BlockFormState>({
    time: initial?.time ?? "",
    label: initial?.label ?? "",
    detail: initial?.detail ?? "",
    icon: initial?.icon ?? "📅",
    tag: initial?.tag ?? "",
  });

  function set<K extends keyof BlockFormState>(key: K, value: BlockFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    if (!form.label.trim()) {
      toast.error("Label is required");
      return;
    }

    onSave({ ...form, tag: form.tag?.trim() || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-semibold">{initial ? "Edit block" : "Add block"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Icon
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {EMOJI_SUGGESTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => set("icon", emoji)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-base transition-colors",
                    form.icon === emoji
                      ? "bg-primary/20 ring-1 ring-primary"
                      : "hover:bg-muted",
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Input
              value={form.icon}
              onChange={(event) => set("icon", event.target.value)}
              placeholder="Or type any emoji"
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Time
            </label>
            <Input
              value={form.time}
              onChange={(event) => set("time", event.target.value)}
              placeholder="e.g. 7:00"
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Label *
            </label>
            <Input
              value={form.label}
              onChange={(event) => set("label", event.target.value)}
              placeholder="e.g. Morning workout"
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Detail
            </label>
            <Input
              value={form.detail}
              onChange={(event) => set("detail", event.target.value)}
              placeholder="Optional description"
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Tag <span className="font-normal">(optional)</span>
            </label>
            <Input
              value={form.tag ?? ""}
              onChange={(event) => set("tag", event.target.value)}
              placeholder="Optional tag"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {initial ? "Save changes" : "Add block"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditableBlockList({
  blocks,
  onUpdate,
}: {
  blocks: TimelineItem[];
  onUpdate: (blocks: TimelineItem[]) => void;
}) {
  const preferences = useUserPreferences();
  const [editing, setEditing] = useState<TimelineItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function handleSaveEdit(data: Omit<TimelineItem, "id">) {
    if (!editing) return;

    onUpdate(
      blocks.map((block) =>
        block.id === editing.id ? { ...data, id: editing.id } : block,
      ),
    );
    setEditing(null);
  }

  function handleAdd(data: Omit<TimelineItem, "id">) {
    onUpdate([...blocks, { ...data, id: makeId() }]);
    setAdding(false);
  }

  function handleDelete(id: string) {
    onUpdate(blocks.filter((block) => block.id !== id));
  }

  function handleDrop() {
    if (dragging === null || dragOver === null || dragging === dragOver) {
      setDragging(null);
      setDragOver(null);
      return;
    }

    const next = [...blocks];
    const [moved] = next.splice(dragging, 1);
    next.splice(dragOver, 0, moved);
    onUpdate(next);
    setDragging(null);
    setDragOver(null);
  }

  return (
    <>
      <div className="space-y-1">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => setDragging(index)}
            onDragEnter={() => setDragOver(index)}
            onDragEnd={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2 transition-colors sm:items-center",
              dragOver === index
                ? "border-primary/50 bg-primary/5"
                : "border-transparent bg-muted/30 hover:bg-muted/50",
            )}
          >
            <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50 sm:mt-0" />
            <span className="mt-0.5 text-base sm:mt-0">{block.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground sm:w-14">
                  {formatTimeStringWithPreferences(block.time, preferences)}
                </span>
                <span className="text-sm font-medium leading-snug">{block.label}</span>
              </div>
              {block.tag ? (
                <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:hidden">
                  {block.tag}
                </span>
              ) : null}
            </div>
            {block.tag ? (
              <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:block">
                {block.tag}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setEditing(block)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(block.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full gap-1.5"
        onClick={() => setAdding(true)}
      >
        <Plus className="h-3.5 w-3.5" /> Add block
      </Button>

      {editing ? (
        <BlockModal
          initial={editing}
          onSave={handleSaveEdit}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {adding ? <BlockModal onSave={handleAdd} onClose={() => setAdding(false)} /> : null}
    </>
  );
}

export function SchedulePage() {
  const today = useTodayDate();
  const { userId, authReady } = useAuth();
  const [selectedDate, setSelectedDate] = useState(today);
  const [log, setLog] = useState<ScheduleLog>(() =>
    authReady && userId ? seedScheduleLog(userId) : buildEmptyScheduleLog(today),
  );
  const [templates, setTemplates] = useState(() =>
    authReady && userId ? seedScheduleTemplates(userId) : seedScheduleTemplates(null),
  );
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingBlocks, setPendingBlocks] = useState<TimelineItem[]>([]);

  useEffect(() => {
    setSelectedDate((current) => (current ? current : today));
  }, [today]);

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const sync = async () => {
      if (!userId) {
        if (!cancelled) {
          setLog(buildEmptyScheduleLog(selectedDate));
          setTemplates(seedScheduleTemplates(null));
        }
        return;
      }

      const [nextLog, nextTemplates] = await Promise.all([
        loadScheduleLog(userId, selectedDate),
        loadScheduleTemplates(userId),
      ]);

      if (!cancelled) {
        setLog(nextLog);
        setTemplates(nextTemplates);
      }
    };

    void sync();

    const handleLogChange = () => {
      void sync();
    };

    window.addEventListener(SCHEDULE_CHANGED_EVENT, handleLogChange);
    window.addEventListener(SCHEDULE_TEMPLATE_EVENT, handleLogChange);

    return () => {
      cancelled = true;
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, handleLogChange);
      window.removeEventListener(SCHEDULE_TEMPLATE_EVENT, handleLogChange);
    };
  }, [authReady, selectedDate, userId]);

  const selectedDayKey = useMemo(
    () => getScheduleDayKeyForDate(selectedDate),
    [selectedDate],
  );
  const config = SCHEDULE_CONFIG[selectedDayKey];
  const blocks = templates[selectedDayKey] ?? [];
  const summary = useMemo(
    () => getScheduleSummary(log, blocks.length),
    [blocks.length, log],
  );
  const completedSet = useMemo(
    () => new Set<number>(log.completed ?? []),
    [log.completed],
  );
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const weekStart = weekDates[0] ?? selectedDate;
  const weekEnd = weekDates[6] ?? selectedDate;

  function startEdit() {
    setPendingBlocks([...blocks]);
    setEditMode(true);
  }

  function cancelEdit() {
    setPendingBlocks([]);
    setEditMode(false);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await saveDayBlocks(userId, selectedDayKey, pendingBlocks, selectedDate);
      const [nextTemplates, nextLog] = await Promise.all([
        loadScheduleTemplates(userId),
        loadScheduleLog(userId, selectedDate, { preferCache: false }),
      ]);
      setTemplates(nextTemplates);
      setLog(nextLog);
      toast.success(`${getScheduleDayLabel(selectedDayKey)} schedule updated`);
      setEditMode(false);
    } catch {
      toast.error("Couldn't save schedule");
    } finally {
      setSaving(false);
    }
  }

  function handleToggleBlock(index: number, done: boolean) {
    const previous = log;
    const optimistic = applyToggleToLog(log, index, done);
    setLog(optimistic);

    void toggleBlock(userId, selectedDate, index, done).catch(() => {
      setLog(previous);
      toast.error("Couldn't update schedule");
    });
  }

  const scheduleConfig = { ...config, blocks };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="px-4 pb-3 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{config.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Edit each weekday separately. The selected day repeats week to week.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {summary.done}/{summary.total} done
              </span>

              {!editMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={startEdit}
                >
                  <Pencil className="h-3 w-3" /> Edit {config.shortLabel}
                </Button>
              ) : (
                <div className="flex w-full gap-1.5 sm:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 flex-1 text-xs sm:flex-none"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 flex-1 text-xs sm:flex-none"
                    onClick={saveEdit}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border bg-muted/20 p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setSelectedDate((current) => addDays(current, -7))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous week
              </Button>
              <div className="text-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {RANGE_FORMATTER.format(parseDateKey(weekStart))} - {RANGE_FORMATTER.format(parseDateKey(weekEnd))}
                </p>
                <button
                  type="button"
                  className="text-xs font-semibold text-foreground hover:text-primary"
                  onClick={() => setSelectedDate(today)}
                >
                  Jump to today
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setSelectedDate((current) => addDays(current, 7))}
              >
                Next week
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date) => {
                const dayKey = getScheduleDayKeyForDate(date);
                const isActive = date === selectedDate;
                const isToday = date === today;
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      setEditMode(false);
                    }}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-center transition-colors",
                      isActive
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:bg-muted/50",
                    )}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                      {WEEKDAY_FORMATTER.format(parseDateKey(date))}
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {DATE_FORMATTER.format(parseDateKey(date))}
                    </div>
                    {isToday ? (
                      <div className="mt-1 text-[10px] font-medium opacity-80">
                        Today
                      </div>
                    ) : (
                      <div className="mt-1 text-[10px] opacity-70">
                        {SCHEDULE_CONFIG[dayKey].shortLabel}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {getDayLabel(selectedDayKey)} plan for {DATE_FORMATTER.format(parseDateKey(selectedDate))}
            </p>
            {summary.total > 0 ? (
              <div className="min-w-[180px] flex-1 space-y-1 sm:max-w-xs">
                <Progress value={summary.pct} className="h-1.5" />
                <div className="text-right text-[10px] tabular-nums text-muted-foreground">
                  {summary.pct}%
                </div>
              </div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="px-3 pb-4">
          {editMode ? (
            <>
              <div className="mb-3 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Changes here update every {config.label} in future weeks.
              </div>
              <EditableBlockList blocks={pendingBlocks} onUpdate={setPendingBlocks} />
            </>
          ) : blocks.length === 0 ? (
            <div className="rounded-lg bg-muted/40 px-3 py-6 text-center">
              <p className="text-sm font-medium">No blocks yet</p>
              <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                Add your first {config.label.toLowerCase()} block to get started.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={startEdit}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add blocks
              </Button>
            </div>
          ) : (
            <TimelineList
              schedule={scheduleConfig}
              completedSet={completedSet}
              onToggle={handleToggleBlock}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
