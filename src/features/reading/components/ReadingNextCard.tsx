import { useRef, useState } from "react";
import { GripVertical, Loader2, Pencil, Save, Sparkles, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBookLookup } from "../useBookLookup";
import { canAcceptDigitsOrBlank } from "../readingUtils";

type QueueBook = { title: string; author: string; totalPages: string };

export function ReadingNextCard(props: {
  queue: QueueBook[];
  onRemove: (index: number) => void;
  onReorder: (newQueue: QueueBook[]) => void;
  onAdd: (book: QueueBook) => void;
  editable: boolean;
  isSaving: boolean;
  hasPendingChanges: boolean;
  onStartEditing: () => void;
  onSave: () => void;
  onCancel: () => void;
  controlsDisabled?: boolean;
}) {
  const {
    queue,
    onRemove,
    onReorder,
    onAdd,
    editable,
    isSaving,
    hasPendingChanges,
    onStartEditing,
    onSave,
    onCancel,
    controlsDisabled = false,
  } = props;

  // ── Add form ────────────────────────────────────────────────────────────
  const [draft, setDraft] = useState<QueueBook>({ title: "", author: "", totalPages: "" });

  const { lookup, state: lookupState } = useBookLookup(({ pages, author }) => {
    setDraft((p) => ({
      ...p,
      ...(pages ? { totalPages: String(pages) } : {}),
      // Only fill author if the field is currently empty
      ...(author && !p.author.trim() ? { author } : {}),
    }));
  });

  function handleAdd() {
    if (!draft.title.trim() && !draft.author.trim()) return;
    onAdd({ ...draft });
    setDraft({ title: "", author: "", totalPages: "" });
  }

  // ── Drag-and-drop ───────────────────────────────────────────────────────
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function handleDragStart(idx: number) {
    dragIndex.current = idx;
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOver(idx);
  }

  function handleDrop(idx: number) {
    const from = dragIndex.current;
    if (from === null || from === idx) {
      setDragOver(null);
      return;
    }
    const next = [...queue];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    onReorder(next);
    dragIndex.current = null;
    setDragOver(null);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOver(null);
  }

  return (
    <Card className="border-emerald-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Up next
            </div>
            <CardTitle className="mt-1 text-base leading-tight">
              {queue.length ? `${queue.length} book${queue.length === 1 ? "" : "s"} queued` : "No books queued"}
            </CardTitle>
          </div>

          {editable ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={onSave}
                disabled={isSaving || !hasPendingChanges}
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onStartEditing}
              disabled={controlsDisabled}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Add a book to queue
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Queue list ── */}
        {queue.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Add books to your queue and they'll auto-promote when you finish your current book.
          </div>
        ) : (
          <div className="space-y-1">
            {queue.map((b, idx) => (
              <div
                key={`${b.title}-${idx}`}
                draggable={editable}
                onDragStart={() => {
                  if (!editable) return;
                  handleDragStart(idx);
                }}
                onDragOver={(e) => {
                  if (!editable) return;
                  handleDragOver(e, idx);
                }}
                onDrop={() => {
                  if (!editable) return;
                  handleDrop(idx);
                }}
                onDragEnd={handleDragEnd}
                className={[
                  "flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors",
                  dragOver === idx
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-transparent bg-muted/30 hover:bg-muted/60",
                  editable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                ].join(" ")}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {idx === 0 ? (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Next</Badge>
                    ) : (
                      <Badge variant="secondary">#{idx + 1}</Badge>
                    )}
                    <span className="truncate text-sm font-medium">{b.title || "Untitled"}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {b.author || "Unknown author"} · {b.totalPages || "?"} pages
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  disabled={!editable}
                  className="shrink-0 rounded p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {editable ? (
          <>
            <Separator />

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add a book</p>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Deep Work"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Author</Label>
                  <Input
                    value={draft.author}
                    onChange={(e) => setDraft((p) => ({ ...p, author: e.target.value }))}
                    placeholder="e.g. Cal Newport"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Total pages</Label>
                  {draft.title.trim() && (
                    <button
                      type="button"
                      onClick={() => lookup(draft.title, draft.author)}
                      disabled={lookupState === "loading"}
                      className="flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300 disabled:opacity-50 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      {lookupState === "loading"   ? "Looking up…" :
                       lookupState === "done"      ? "Found ✓" :
                       lookupState === "not_found" ? "Not found" :
                       lookupState === "error"     ? "Try again" :
                       "Look up book info"}
                    </button>
                  )}
                </div>
                <Input
                  value={draft.totalPages}
                  onChange={(e) => {
                    if (!canAcceptDigitsOrBlank(e.target.value)) return;
                    setDraft((p) => ({ ...p, totalPages: e.target.value }));
                  }}
                  inputMode="numeric"
                  placeholder="e.g. 304"
                />
              </div>

              <Button
                onClick={handleAdd}
                disabled={!draft.title.trim() && !draft.author.trim()}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Add to queue
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
