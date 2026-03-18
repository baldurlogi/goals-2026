import { useRef, useState } from "react";
import { CheckSquare, ChevronDown, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { type TodoItem } from "@/features/todos/todoStorage";
import {
  useAddTodoMutation,
  useClearCompletedMutation,
  useDeleteTodoMutation,
  useTodosQuery,
  useToggleTodoMutation,
} from "@/features/todos/useTodosQuery";
import type { StorageMutationResult } from "@/lib/storageResult";

export function TodosPage() {
  const { data: todos = [] } = useTodosQuery();
  const addTodoMutation = useAddTodoMutation();
  const toggleTodoMutation = useToggleTodoMutation();
  const deleteTodoMutation = useDeleteTodoMutation();
  const clearCompletedMutation = useClearCompletedMutation();
  const [input, setInput]           = useState("");
  const [showDone, setShowDone]     = useState(false);
  const inputRef                    = useRef<HTMLInputElement>(null);

  async function handleMutationWithToast(
    mutation: () => Promise<StorageMutationResult>,
    retry: () => void,
    successMessage?: string,
  ) {
    const result = await mutation();
    if (!result.ok) {
      toast.error(result.error ?? "Couldn't update your todos.", {
        action: {
          label: "Retry",
          onClick: retry,
        },
      });
      return;
    }

    if (successMessage) toast.success(successMessage);
  }

  function handleAdd() {
    if (!input.trim()) return;
    const nextInput = input;
    void handleMutationWithToast(
      () => addTodoMutation.mutateAsync(nextInput),
      () => void addTodoMutation.mutate(nextInput),
      "Task added",
    );
    setInput("");
    inputRef.current?.focus();
  }

  const incomplete = todos.filter((t) => !t.done);
  const done       = todos.filter((t) => t.done);

  return (
    <PageScaffold width="narrow" className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="To-do"
          description="Keep daily tasks clear and focused."
          icon={<CheckSquare className="h-5 w-5 text-sky-500" />}
        />
        {done.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={() =>
              void handleMutationWithToast(
                () => clearCompletedMutation.mutateAsync(undefined),
                () => void clearCompletedMutation.mutate(undefined),
              )
            }
          >
            <Trash2 className="h-3 w-3" />
            Clear completed
          </Button>
        )}
      </div>

      {/* Quick-add */}
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a task and press Enter…"
          className="h-10 flex-1 bg-card"
        />
        <Button onClick={handleAdd} disabled={!input.trim()} size="sm">
          Add
        </Button>
      </div>

      {/* Incomplete list */}
      {incomplete.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          All clear 🎉 — nothing left to do.
        </div>
      ) : (
        <div className="divide-y divide-border/50 rounded-xl border bg-card">
          {incomplete.map((item) => (
            <TodoRow key={item.id} item={item} onMutate={handleMutationWithToast} toggleTodoMutation={toggleTodoMutation} deleteTodoMutation={deleteTodoMutation} />
          ))}
        </div>
      )}

      {/* Completed — collapsed by default */}
      {done.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowDone((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showDone ? "rotate-180" : ""}`}
            />
            {done.length} completed
          </button>

          {showDone && (
            <div className="mt-2 divide-y divide-border/50 rounded-xl border bg-card opacity-70">
              {done.map((item) => (
                <TodoRow key={item.id} item={item} onMutate={handleMutationWithToast} toggleTodoMutation={toggleTodoMutation} deleteTodoMutation={deleteTodoMutation} />
              ))}
            </div>
          )}
        </div>
      )}
    </PageScaffold>
  );
}

function TodoRow({
  item,
  onMutate,
  toggleTodoMutation,
  deleteTodoMutation,
}: {
  item: TodoItem;
  onMutate: (
    mutation: () => Promise<StorageMutationResult>,
    retry: () => void,
    successMessage?: string,
  ) => Promise<void>;
  toggleTodoMutation: { mutateAsync: (id: string) => Promise<StorageMutationResult>; mutate: (id: string) => void };
  deleteTodoMutation: { mutateAsync: (id: string) => Promise<StorageMutationResult>; mutate: (id: string) => void };
}) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <Checkbox
        checked={item.done}
        onCheckedChange={() =>
          void onMutate(
            () => toggleTodoMutation.mutateAsync(item.id),
            () => void toggleTodoMutation.mutate(item.id),
          )
        }
        className="shrink-0"
      />
      <span
        className={`flex-1 text-sm leading-snug ${
          item.done ? "text-muted-foreground line-through" : ""
        }`}
      >
        {item.text}
      </span>
      <button
        type="button"
        onClick={() =>
          void onMutate(
            () => deleteTodoMutation.mutateAsync(item.id),
            () => void deleteTodoMutation.mutate(item.id),
          )
        }
        className="invisible shrink-0 text-muted-foreground/40 hover:text-muted-foreground group-hover:visible"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
