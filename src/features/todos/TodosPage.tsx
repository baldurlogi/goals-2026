import { useEffect, useRef, useState } from "react";
import { CheckSquare, ChevronDown, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  listTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
  TODO_CHANGED_EVENT,
  type TodoItem,
} from "@/features/todos/todoStorage";

export function TodosPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const data = await listTodos();
      if (alive) setTodos(data as TodoItem[]);
    };

    load();

    const onChanged = () => load();
    window.addEventListener(TODO_CHANGED_EVENT, onChanged);

    return () => {
      alive = false;
      window.removeEventListener(TODO_CHANGED_EVENT, onChanged);
    };
  }, []);

  async function handleAdd() {
    const text = input.trim();
    if (!text) return;

    await addTodo(text); // addTodo is async in your storage
    setInput("");
    inputRef.current?.focus();
    // no need to call listTodos() here because TODO_CHANGED_EVENT should fire,
    // but it's fine either way.
  }

  const incomplete = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-sky-500" />
          <h1 className="text-xl font-semibold">To-do</h1>
        </div>

        {done.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={() => clearCompleted()}
          >
            <Trash2 className="h-3 w-3" />
            Clear completed
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a task and press Enter…"
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button onClick={handleAdd} disabled={!input.trim()} size="sm">
          Add
        </Button>
      </div>

      {incomplete.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          All clear 🎉 — nothing left to do.
        </div>
      ) : (
        <div className="divide-y divide-border/50 rounded-xl border bg-card">
          {incomplete.map((item) => (
            <TodoRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowDone((s: boolean) => !s)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                showDone ? "rotate-180" : ""
              }`}
            />
            {done.length} completed
          </button>

          {showDone && (
            <div className="mt-2 divide-y divide-border/50 rounded-xl border bg-card opacity-70">
              {done.map((item) => (
                <TodoRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TodoRow({ item }: { item: TodoItem }) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <Checkbox
        checked={item.done}
        onCheckedChange={() => toggleTodo(item.id)}
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
        onClick={() => deleteTodo(item.id)}
        className="invisible shrink-0 text-muted-foreground/40 hover:text-muted-foreground group-hover:visible"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}