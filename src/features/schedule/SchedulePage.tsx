import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, X, Check } from "lucide-react";
import type { ScheduleView, TimelineItem } from "./scheduleTypes";
import { SCHEDULE_CONFIG } from "./scheduleData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SchedulePicker } from "./components/SchedulePicker";
import { TimelineList } from "./components/TimelineList";
import { useAuth } from "@/features/auth/authContext";
import { formatTimeStringWithPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";
import {
  applyToggleToLog,
  applyViewToLog,
  loadScheduleLog,
  loadScheduleTemplates,
  saveViewBlocks,
  seedScheduleLog,
  seedScheduleTemplates,
  setTodayView,
  toggleBlock,
  getScheduleSummary,
  SCHEDULE_CHANGED_EVENT,
  SCHEDULE_TEMPLATE_EVENT,
} from "./scheduleStorage";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

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
  onSave: (b: Omit<TimelineItem, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<BlockFormState>({
    time: initial?.time ?? "",
    label: initial?.label ?? "",
    detail: initial?.detail ?? "",
    icon: initial?.icon ?? "📅",
    tag: initial?.tag ?? "",
  });

  function set<K extends keyof BlockFormState>(k: K, v: BlockFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
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
              {EMOJI_SUGGESTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => set("icon", e)}
                  className={`rounded-lg px-2 py-1 text-base transition-colors ${
                    form.icon === e
                      ? "bg-primary/20 ring-1 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <Input
              value={form.icon}
              onChange={(e) => set("icon", e.target.value)}
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
              onChange={(e) => set("time", e.target.value)}
              placeholder="e.g. 7:00 or Morning"
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Label *
            </label>
            <Input
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
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
              onChange={(e) => set("detail", e.target.value)}
              placeholder="Optional description"
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Tag <span className="font-normal">(e.g. calories, notes)</span>
            </label>
            <Input
              value={form.tag ?? ""}
              onChange={(e) => set("tag", e.target.value)}
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

  function handleEdit(block: TimelineItem) {
    setEditing(block);
  }

  function handleSaveEdit(data: Omit<TimelineItem, "id">) {
    onUpdate(
      blocks.map((b) => (b.id === editing!.id ? { ...data, id: editing!.id } : b)),
    );
    setEditing(null);
  }

  function handleAdd(data: Omit<TimelineItem, "id">) {
    onUpdate([...blocks, { ...data, id: makeId() }]);
    setAdding(false);
  }

  function handleDelete(id: string) {
    onUpdate(blocks.filter((b) => b.id !== id));
  }

  function handleDragStart(i: number) {
    setDragging(i);
  }

  function handleDragEnter(i: number) {
    setDragOver(i);
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
        {blocks.map((block, i) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 transition-colors sm:items-center ${
              dragOver === i
                ? "border-primary/50 bg-primary/5"
                : "border-transparent bg-muted/30 hover:bg-muted/50"
            }`}
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
              {block.tag && (
                <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:hidden">
                  {block.tag}
                </span>
              )}
            </div>
            {block.tag && (
              <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:block">
                {block.tag}
              </span>
            )}
            <button
              type="button"
              onClick={() => handleEdit(block)}
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

      {editing && (
        <BlockModal
          initial={editing}
          onSave={handleSaveEdit}
          onClose={() => setEditing(null)}
        />
      )}
      {adding && <BlockModal onSave={handleAdd} onClose={() => setAdding(false)} />}
    </>
  );
}

export function SchedulePage() {
  const { userId, authReady } = useAuth();

  const [log, setLog] = useState(() =>
    authReady && userId ? seedScheduleLog(userId) : seedScheduleLog(null),
  );
  const [templates, setTemplates] = useState(() =>
    authReady && userId ? seedScheduleTemplates(userId) : seedScheduleTemplates(null),
  );
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingBlocks, setPendingBlocks] = useState<TimelineItem[]>([]);

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const sync = async () => {
      const next = await loadScheduleLog(userId);
      if (!cancelled) setLog(next);
    };

    void sync();
    window.addEventListener(SCHEDULE_CHANGED_EVENT, sync);

    return () => {
      cancelled = true;
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, sync);
    };
  }, [authReady, userId]);

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const sync = async () => {
      const next = await loadScheduleTemplates(userId);
      if (!cancelled) setTemplates(next);
    };

    void sync();
    window.addEventListener(SCHEDULE_TEMPLATE_EVENT, sync);

    return () => {
      cancelled = true;
      window.removeEventListener(SCHEDULE_TEMPLATE_EVENT, sync);
    };
  }, [authReady, userId]);

  const view: ScheduleView = log.view;
  const config = SCHEDULE_CONFIG[view];
  const blocks = templates[view];

  const summary = useMemo(
    () => getScheduleSummary(log, blocks.length),
    [blocks.length, log],
  );

  const completedSet = useMemo(
    () => new Set<number>(log.completed ?? []),
    [log.completed],
  );

  const handleViewChange = (v: ScheduleView) => {
    const previous = log;
    const optimistic = applyViewToLog(log, v);
    setLog(optimistic);

    void setTodayView(userId, v).catch(() => {
      setLog(previous);
      toast.error("Couldn't switch schedule view");
    });
  };

  const handleToggleBlock = (index: number, done: boolean) => {
    const previous = log;
    const optimistic = applyToggleToLog(log, index, done);
    setLog(optimistic);

    void toggleBlock(userId, index, done).catch(() => {
      setLog(previous);
      toast.error("Couldn't update schedule");
    });
  };

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
      await saveViewBlocks(userId, view, pendingBlocks);
      const next = await loadScheduleTemplates(userId);
      setTemplates(next);
      toast.success("Schedule updated");
      setEditMode(false);
    } catch {
      toast.error("Couldn't save schedule");
    } finally {
      setSaving(false);
    }
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
                Tap a row to expand · check off to track progress
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
                  <Pencil className="h-3 w-3" /> Edit
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

          <div className="mt-3 overflow-x-auto">
            <SchedulePicker value={view} onChange={handleViewChange} />
          </div>

          {summary.total > 0 && (
            <div className="mt-3 space-y-1">
              <Progress value={summary.pct} className="h-1.5" />
            </div>
          )}
        </CardHeader>

        <CardContent className="px-3 pb-4">
          {editMode ? (
            <EditableBlockList blocks={pendingBlocks} onUpdate={setPendingBlocks} />
          ) : blocks.length === 0 ? (
            <div className="rounded-lg bg-muted/40 px-3 py-6 text-center">
              <p className="text-sm font-medium">No blocks yet</p>
              <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                Add your first schedule block to get started.
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
