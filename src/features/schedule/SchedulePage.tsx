import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Brain,
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Repeat,
  Sparkles,
} from "lucide-react";
import type { ScheduleLog } from "./scheduleStorage";
import type { TimelineItem } from "./scheduleTypes";
import {
  SCHEDULE_CONFIG,
  getScheduleDayLabel,
  getScheduleDayLabel as getDayLabel,
} from "./scheduleData";
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

function parseScheduleTimeToMinutes(time: string) {
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return Math.min(Math.max(hours, 0), 23) * 60 + Math.min(Math.max(minutes, 0), 59);
}

function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
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

const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
});

const QUICK_BLOCKS: Array<Omit<TimelineItem, "id">> = [
  { time: "7:30", label: "Morning reset", detail: "A calm start before the day accelerates.", icon: "⏰", tag: "routine" },
  { time: "9:00", label: "Deep work", detail: "Protect one focused block.", icon: "💻", tag: "focus" },
  { time: "12:30", label: "Meal break", detail: "Step away and refuel properly.", icon: "🥗", tag: "recovery" },
  { time: "17:30", label: "Workout", detail: "Move before the evening opens up.", icon: "💪", tag: "energy" },
  { time: "21:30", label: "Wind down", detail: "Lower the pace and protect tomorrow.", icon: "🌙", tag: "sleep" },
];

const ICON_GROUPS = [
  ["⏰", "💻", "🧠", "📝", "📅"],
  ["💪", "🏋️", "🏃", "🚶", "🥤"],
  ["🥣", "🥗", "🍽️", "🍎", "🌙"],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="ai-layer relative w-full max-w-md overflow-hidden rounded-[2rem] border-0 bg-background/80 shadow-[0_34px_120px_rgba(2,6,23,0.45)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative flex items-center justify-between px-5 pb-2 pt-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Schedule block
            </p>
            <h3 className="mt-1 text-lg font-semibold">{initial ? "Refine rhythm" : "Add rhythm"}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-background/30 p-2 text-muted-foreground transition-colors hover:bg-background/50 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative space-y-4 px-5 py-4">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Rhythm icon
            </label>
            <div className="space-y-2">
              {ICON_GROUPS.map((group, groupIndex) => (
                <div key={groupIndex} className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {group.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => set("icon", emoji)}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base transition-all",
                        form.icon === emoji
                          ? "bg-emerald-300 text-slate-950 shadow-[0_0_22px_rgba(74,222,128,0.22)]"
                          : "bg-background/30 hover:bg-background/50",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <Input
              value={form.icon}
              onChange={(event) => set("icon", event.target.value)}
              placeholder="Or type any emoji"
              className="mt-2 h-9 rounded-xl border-white/8 bg-background/30 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-[0.42fr_1fr]">
            <label className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Time
              </span>
              <Input
                value={form.time}
                onChange={(event) => set("time", event.target.value)}
                placeholder="7:00"
                className="h-10 rounded-xl border-white/8 bg-background/30 text-sm"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Label
              </span>
              <Input
                value={form.label}
                onChange={(event) => set("label", event.target.value)}
                placeholder="Morning workout"
                className="h-10 rounded-xl border-white/8 bg-background/30 text-sm"
              />
            </label>
          </div>

          <label className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Detail
            </span>
            <Input
              value={form.detail}
              onChange={(event) => set("detail", event.target.value)}
              placeholder="Optional note for this rhythm"
              className="h-10 rounded-xl border-white/8 bg-background/30 text-sm"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Tag
            </span>
            <Input
              value={form.tag ?? ""}
              onChange={(event) => set("tag", event.target.value)}
              placeholder="focus, recovery, routine..."
              className="h-10 rounded-xl border-white/8 bg-background/30 text-sm"
            />
          </label>
        </div>

        <div className="relative flex justify-end gap-2 px-5 pb-5 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full text-muted-foreground">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
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
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {QUICK_BLOCKS.map((block) => (
          <button
            key={`${block.time}-${block.label}`}
            type="button"
            onClick={() => onUpdate([...blocks, { ...block, id: makeId() }])}
            className="rounded-full bg-background/24 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-background/40 hover:text-foreground"
          >
            <span className="mr-1.5">{block.icon}</span>
            {block.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => setDragging(index)}
            onDragEnter={() => setDragOver(index)}
            onDragEnd={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            className={cn(
              "group flex items-start gap-2 rounded-[1.25rem] px-3 py-3 transition-colors sm:items-center",
              dragOver === index
                ? "bg-emerald-300/10 shadow-[inset_0_0_0_1px_rgba(110,231,183,0.22)]"
                : "bg-background/16 hover:bg-background/28",
            )}
          >
            <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50 sm:mt-0" />
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm sm:mt-0">
              {block.icon}
            </span>
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
            <div className="flex shrink-0 items-center gap-1 opacity-80 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setEditing(block)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-background/38 hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(block.id)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-background/38 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-4 w-full gap-1.5 rounded-full bg-background/22 text-muted-foreground hover:bg-background/38 hover:text-foreground"
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
  const preferences = useUserPreferences();
  const weekRailRef = useRef<HTMLDivElement | null>(null);
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
  const isSelectedToday = selectedDate === today;
  const rhythm = useMemo(() => {
    const nowMinutes = getNowMinutes();
    const timedBlocks = blocks.map((block, index) => ({
      block,
      index,
      minutes: parseScheduleTimeToMinutes(block.time),
      done: completedSet.has(index),
    }));
    const sorted = timedBlocks
      .filter((item) => item.minutes !== null)
      .sort((left, right) => (left.minutes ?? 0) - (right.minutes ?? 0));

    const firstIncomplete = timedBlocks.find((item) => !item.done) ?? null;
    let nowItem: (typeof timedBlocks)[number] | null = null;
    let nextItem: (typeof timedBlocks)[number] | null = null;

    if (isSelectedToday) {
      nowItem =
        [...sorted]
          .reverse()
          .find((item) => (item.minutes ?? 0) <= nowMinutes && !item.done) ??
        null;
      nextItem =
        sorted.find((item) => (item.minutes ?? 0) > nowMinutes && !item.done) ??
        firstIncomplete;
    } else {
      nextItem = firstIncomplete;
    }

    const progressPct = isSelectedToday
      ? Math.min(100, Math.round((nowMinutes / 1440) * 100))
      : summary.pct;

    return {
      nowItem,
      nextItem,
      progressPct,
      remaining: timedBlocks.filter((item) => !item.done).length,
    };
  }, [blocks, completedSet, isSelectedToday, summary.pct]);
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const weekStart = weekDates[0] ?? selectedDate;
  const weekEnd = weekDates[6] ?? selectedDate;

  useEffect(() => {
    const rail = weekRailRef.current;
    const selectedDay = rail?.querySelector<HTMLButtonElement>(
      `[data-schedule-date="${selectedDate}"]`,
    );

    selectedDay?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedDate, weekDates]);

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
    <div className="relative -mx-4 -mt-6 min-h-[calc(100vh-5rem)] overflow-hidden px-4 pb-14 pt-6 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_2%,rgba(74,222,128,0.12),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(103,232,249,0.09),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_44%)]" />

      <div className="mx-auto max-w-7xl space-y-6">
        <section className="ai-atmosphere ai-depth-stage ai-motion-enter relative overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_18%_10%,rgba(74,222,128,0.15),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(103,232,249,0.10),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.014))] px-4 py-5 shadow-[0_28px_90px_rgba(2,6,23,0.20)] sm:px-6">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.75fr)] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-background/24 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
                <CalendarClock className="h-3.5 w-3.5" />
                Daily rhythm
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                {config.label} rhythm
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                The shape of this day repeats every {config.label}. Adjust it once, and future {config.label}s inherit the rhythm.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/24 px-3 py-1.5 text-xs text-muted-foreground">
                  <Repeat className="h-3.5 w-3.5 text-emerald-100" />
                  Repeats weekly
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/24 px-3 py-1.5 text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5 text-cyan-100" />
                  {summary.done}/{summary.total} complete
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Day progress
                </span>
                <span className="text-xs font-semibold tabular-nums text-emerald-100">
                  {isSelectedToday ? rhythm.progressPct : summary.pct}%
                </span>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-background/45 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-200 to-violet-300 shadow-[0_0_24px_rgba(52,211,153,0.24)] transition-all duration-700"
                  style={{ width: `${isSelectedToday ? rhythm.progressPct : summary.pct}%` }}
                />
                <div className="absolute inset-0 animate-[ai-sheen_6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-30" />
              </div>

              <div className="flex flex-wrap gap-2">
                {!editMode ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-full bg-background/26 px-3 text-xs text-foreground hover:bg-background/42"
                    onClick={startEdit}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Tune {config.shortLabel}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 rounded-full text-xs text-muted-foreground"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-9 rounded-full bg-emerald-500 px-4 text-xs text-slate-950 hover:bg-emerald-400"
                      onClick={saveEdit}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save rhythm"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-full bg-background/20 p-0 sm:w-auto sm:px-3"
              onClick={() => setSelectedDate((current) => addDays(current, -7))}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden text-xs sm:inline">Previous week</span>
            </Button>
            <div className="min-w-0 text-center">
              <p className="text-[11px] font-medium text-muted-foreground">
                {RANGE_FORMATTER.format(parseDateKey(weekStart))} - {RANGE_FORMATTER.format(parseDateKey(weekEnd))}
              </p>
              <button
                type="button"
                className="mt-0.5 rounded-full px-2 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-background/32 hover:text-emerald-100"
                onClick={() => setSelectedDate(today)}
              >
                Jump to today
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-full bg-background/20 p-0 sm:w-auto sm:px-3"
              onClick={() => setSelectedDate((current) => addDays(current, 7))}
              aria-label="Next week"
            >
              <span className="hidden text-xs sm:inline">Next week</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div
            ref={weekRailRef}
            className="flex snap-x gap-2 overflow-x-auto px-1 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-7 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
          >
            {weekDates.map((date) => {
              const dayKey = getScheduleDayKeyForDate(date);
              const isActive = date === selectedDate;
              const isToday = date === today;
              const parsedDate = parseDateKey(date);
              return (
                <button
                  key={date}
                  type="button"
                  data-schedule-date={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setEditMode(false);
                  }}
                  className={cn(
                    "min-h-[4.4rem] min-w-[4.9rem] snap-center rounded-[1.35rem] px-3 py-2.5 text-center transition-all duration-300 sm:min-w-0",
                    isActive
                      ? "bg-emerald-300 text-slate-950 shadow-[0_16px_42px_rgba(74,222,128,0.16)]"
                      : isToday
                        ? "bg-emerald-300/10 text-foreground hover:bg-emerald-300/15"
                        : "bg-background/18 text-foreground hover:bg-background/30",
                  )}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-75">
                    {WEEKDAY_FORMATTER.format(parsedDate)}
                  </div>
                  <div className="mt-1 flex items-baseline justify-center gap-1">
                    <span className="text-xl font-bold leading-none tabular-nums">
                      {parsedDate.getDate()}
                    </span>
                    <span className="text-[10px] font-semibold uppercase opacity-70">
                      {MONTH_FORMATTER.format(parsedDate)}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[10px] opacity-70">
                    {isToday ? "Today" : SCHEDULE_CONFIG[dayKey].shortLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(20rem,0.28fr)] lg:items-start">
          <section className="ai-layer relative overflow-hidden rounded-[2rem] p-4 sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {getDayLabel(selectedDayKey)} plan
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {DATE_FORMATTER.format(parseDateKey(selectedDate))}
                </h2>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {editMode
                  ? `Changes update every future ${config.label}.`
                  : rhythm.remaining > 0
                    ? `${rhythm.remaining} block${rhythm.remaining === 1 ? "" : "s"} remaining today.`
                    : "The rhythm is complete for this view."}
              </p>
            </div>

            {editMode ? (
              <>
                <div className="mb-4 rounded-[1.35rem] bg-background/18 px-4 py-3 text-xs leading-5 text-muted-foreground">
                  Tuning this rhythm changes every {config.label}. Quick adds are suggestions you can adjust after placing them.
                </div>
                <EditableBlockList blocks={pendingBlocks} onUpdate={setPendingBlocks} />
              </>
            ) : blocks.length === 0 ? (
              <div className="rounded-[1.5rem] bg-background/20 px-4 py-8 text-center">
                <p className="text-sm font-medium">No rhythm blocks yet</p>
                <p className="mb-4 mt-1 text-xs text-muted-foreground">
                  Add the first {config.label.toLowerCase()} block to give the day shape.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startEdit}
                  className="gap-1.5 rounded-full bg-background/28"
                >
                  <Plus className="h-3.5 w-3.5" /> Add blocks
                </Button>
              </div>
            ) : (
              <TimelineList
                schedule={scheduleConfig}
                completedSet={completedSet}
                onToggle={handleToggleBlock}
                focusIndex={rhythm.nowItem?.index ?? null}
                nextIndex={rhythm.nextItem?.index ?? null}
              />
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="ai-layer-soft rounded-[1.75rem] p-4">
              <div className="flex items-start gap-3">
                <span className="ai-float flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-100">
                  <Brain className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
                    Rhythm signal
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {summary.total === 0
                      ? "Give this day one anchor block and it will start to feel easier to follow."
                      : summary.pct >= 80
                        ? "Most of the rhythm is resolved. Keep the ending gentle."
                        : rhythm.remaining <= 2
                          ? "Only a small amount remains. The day is narrowing nicely."
                          : "Today has a clear structure. Follow the next visible block, not the whole list."}
                  </p>
                </div>
              </div>
            </section>

            <section className="ai-layer-soft rounded-[1.75rem] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                Now / next
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-[1.25rem] bg-background/18 px-3 py-3">
                  <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Now
                  </div>
                  <p className="text-sm font-semibold">
                    {rhythm.nowItem?.block.label ?? (isSelectedToday ? "Between blocks" : "Not today")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rhythm.nowItem?.block.time
                      ? formatTimeStringWithPreferences(rhythm.nowItem.block.time, preferences)
                      : "Use the next block as your anchor."}
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-background/18 px-3 py-3">
                  <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Next
                  </div>
                  <p className="text-sm font-semibold">
                    {rhythm.nextItem?.block.label ?? "Nothing remaining"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rhythm.nextItem?.block.time
                      ? formatTimeStringWithPreferences(rhythm.nextItem.block.time, preferences)
                      : "The day is complete in this rhythm."}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
