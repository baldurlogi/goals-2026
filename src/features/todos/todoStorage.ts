import { supabase } from "@/lib/supabaseClient";

export const TODO_CHANGED_EVENT = "todos:changed";
const emit = () => window.dispatchEvent(new Event(TODO_CHANGED_EVENT));

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

// ── Cache ──────────────────────────────────────────────────────────────────
const TODO_CACHE_KEY = "cache:todos:v1";

function readTodoCache(): Todo[] | null {
  try {
    const raw = localStorage.getItem(TODO_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : null;
  } catch { return null; }
}

function writeTodoCache(todos: Todo[]): void {
  try { localStorage.setItem(TODO_CACHE_KEY, JSON.stringify(todos)); } catch { /* ignore */ }
}

/** Synchronous seed — returns todos from cache. Zero network. */
export function seedTodos(): Todo[] {
  return readTodoCache() ?? [];
}

export async function listTodos(): Promise<Todo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return readTodoCache() ?? [];

  // Return cache immediately if available
  const cached = readTodoCache();
  if (cached) {
    // Refresh in background without blocking
    supabase
      .from("todos")
      .select("id,text,done,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) writeTodoCache(data as Todo[]); });
    return cached;
  }

  const { data, error } = await supabase
    .from("todos")
    .select("id,text,done,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("listTodos error:", error);
    return [];
  }

  const todos = (data ?? []) as Todo[];
  writeTodoCache(todos);
  return todos;
}

export async function addTodo(text: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const trimmed = text.trim();
  if (!trimmed) return;

  const { error } = await supabase
    .from("todos")
    .insert({ user_id: user.id, text: trimmed, done: false });

  if (error) console.warn("addTodo error:", error);
  else try { localStorage.removeItem(TODO_CACHE_KEY); } catch { /* ignore */ }
  emit();
}

export async function setTodoDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from("todos")
    .update({ done })
    .eq("id", id);

  if (error) console.warn("setTodoDone error:", error);
  try { localStorage.removeItem(TODO_CACHE_KEY); } catch { /* ignore */ }
  emit();
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("id", id);

  if (error) console.warn("deleteTodo error:", error);
  try { localStorage.removeItem(TODO_CACHE_KEY); } catch { /* ignore */ }
  emit();
}

export async function clearCompleted(): Promise<void> {
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("done", true);

  if (error) console.warn("clearCompleted error:", error);
  try { localStorage.removeItem(TODO_CACHE_KEY); } catch { /* ignore */ }
  emit();
}


export type TodoItem = Todo;

export async function toggleTodo(id: string): Promise<void> {
  // Read current value
  const { data, error } = await supabase
    .from("todos")
    .select("done")
    .eq("id", id)
    .single();

  if (error) {
    console.warn("toggleTodo select error:", error);
    return;
  }

  const nextDone = !data?.done;

  const { error: updateError } = await supabase
    .from("todos")
    .update({ done: nextDone })
    .eq("id", id);

  if (updateError) console.warn("toggleTodo update error:", updateError);
  emit();
}

// Keep this, but it’s async:
export const loadTodos = listTodos;