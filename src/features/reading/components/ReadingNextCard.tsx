import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [draft, setDraft] = useState<QueueBook>({
    title: "",
    author: "",
    totalPages: "",
  });

  const { lookup, state: lookupState } = useBookLookup(({ pages, author }) => {
    setDraft((p) => ({
      ...p,
      ...(pages ? { totalPages: String(pages) } : {}),
      ...(author && !p.author.trim() ? { author } : {}),
    }));
  });

  function handleAdd() {
    if (!draft.title.trim() && !draft.author.trim()) return;
    onAdd({ ...draft });
    setDraft({ title: "", author: "", totalPages: "" });
  }

  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function moveBook(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= queue.length) return;
    const next = [...queue];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onReorder(next);
  }

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

  const featured = queue[0];
  const later = queue.slice(1);

  return (
    <section className="ai-motion-enter space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
            Future trajectory
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {queue.length ? `${queue.length} idea${queue.length === 1 ? "" : "s"} ahead` : "Open path"}
          </h2>
        </div>

        {editable ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={isSaving || !hasPendingChanges}
              className="gap-2 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-full text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onStartEditing}
            disabled={controlsDisabled}
            className="rounded-full bg-background/24 text-muted-foreground hover:bg-background/42 hover:text-foreground"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Shape path
          </Button>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="ai-layer-soft rounded-[1.75rem] px-5 py-7 text-center">
          <Sparkles className="mx-auto h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-sm font-medium">No future thread selected yet.</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Add the next book when a question starts pulling at you.
          </p>
        </div>
      ) : (
        <div className="relative space-y-4">
          <div className="pointer-events-none absolute bottom-8 left-4 top-12 w-px bg-gradient-to-b from-emerald-300/50 via-cyan-300/20 to-transparent" />

          {featured ? (
            <div
              draggable={editable}
              onDragStart={() => {
                if (!editable) return;
                handleDragStart(0);
              }}
              onDragOver={(event) => {
                if (!editable) return;
                handleDragOver(event, 0);
              }}
              onDrop={() => {
                if (!editable) return;
                handleDrop(0);
              }}
              onDragEnd={handleDragEnd}
              className={[
                "relative ml-8 rounded-[1.75rem] bg-background/28 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_18px_54px_rgba(2,6,23,0.12)] transition-all duration-300",
                dragOver === 0 ? "bg-emerald-500/12" : "",
                editable ? "cursor-grab active:cursor-grabbing" : "",
              ].join(" ")}
            >
              <span className="absolute -left-[2.35rem] top-6 h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.7)]" />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                    Next threshold
                  </p>
                  <h3 className="mt-2 truncate text-lg font-semibold">
                    {featured.title || "Untitled"}
                  </h3>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {featured.author || "Unknown author"}
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {featured.totalPages || "?"} pages waiting in the slipstream.
                  </p>
                </div>

                {editable ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled
                      aria-label="Move up"
                      className="h-8 w-8 rounded-full text-muted-foreground"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => moveBook(0, 1)}
                      disabled={queue.length < 2}
                      aria-label="Move down"
                      className="h-8 w-8 rounded-full text-muted-foreground"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemove(0)}
                      aria-label="Remove"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {later.length > 0 ? (
            <div className="ml-8 space-y-2">
              {later.map((book, laterIndex) => {
                const index = laterIndex + 1;
                return (
                  <div
                    key={`${book.title}-${index}`}
                    draggable={editable}
                    onDragStart={() => {
                      if (!editable) return;
                      handleDragStart(index);
                    }}
                    onDragOver={(event) => {
                      if (!editable) return;
                      handleDragOver(event, index);
                    }}
                    onDrop={() => {
                      if (!editable) return;
                      handleDrop(index);
                    }}
                    onDragEnd={handleDragEnd}
                    className={[
                      "relative flex items-center gap-3 rounded-[1.1rem] px-3 py-3 transition-all duration-300",
                      dragOver === index
                        ? "bg-emerald-500/10"
                        : "bg-background/12 hover:bg-background/22",
                      editable ? "cursor-grab active:cursor-grabbing" : "",
                    ].join(" ")}
                  >
                    <span className="absolute -left-[2.15rem] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-200/70" />
                    <span className="w-7 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{book.title || "Untitled"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {book.author || "Unknown author"} · {book.totalPages || "?"} pages
                      </p>
                    </div>
                    {editable ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => moveBook(index, -1)}
                          aria-label="Move up"
                          className="h-8 w-8 rounded-full text-muted-foreground"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => moveBook(index, 1)}
                          disabled={index === queue.length - 1}
                          aria-label="Move down"
                          className="h-8 w-8 rounded-full text-muted-foreground"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => onRemove(index)}
                          aria-label="Remove"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}

      {editable ? (
        <div className="ai-layer-soft rounded-[1.65rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Add signal
            </p>
            {draft.title.trim() ? (
              <button
                type="button"
                onClick={() => lookup(draft.title, draft.author)}
                disabled={lookupState === "loading"}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium text-cyan-200 transition-colors hover:bg-background/30 disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" />
                {lookupState === "loading"
                  ? "Looking up..."
                  : lookupState === "done"
                    ? "Found"
                    : lookupState === "not_found"
                      ? "Not found"
                      : lookupState === "error"
                        ? "Try again"
                        : "Find pages"}
              </button>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1.2fr_0.8fr_0.45fr_auto]">
            <Input
              value={draft.title}
              onChange={(event) => setDraft((p) => ({ ...p, title: event.target.value }))}
              placeholder="Title"
              className="border-white/8 bg-background/30"
            />
            <Input
              value={draft.author}
              onChange={(event) => setDraft((p) => ({ ...p, author: event.target.value }))}
              placeholder="Author"
              className="border-white/8 bg-background/30"
            />
            <Input
              value={draft.totalPages}
              onChange={(event) => {
                if (!canAcceptDigitsOrBlank(event.target.value)) return;
                setDraft((p) => ({ ...p, totalPages: event.target.value }));
              }}
              inputMode="numeric"
              placeholder="Pages"
              className="border-white/8 bg-background/30"
            />
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!draft.title.trim() && !draft.author.trim()}
              className="gap-2 rounded-full bg-background/40 text-foreground hover:bg-background/60"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {hasPendingChanges ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-200/80">
              <Check className="h-3.5 w-3.5" />
              Path adjusted. Save when it feels right.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
