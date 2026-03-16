import { supabase } from "@/lib/supabaseClient";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { storageError, storageOk, type StorageMutationResult } from "@/lib/storageResult";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";

export const TODO_CHANGED_EVENT = "todos:changed";
const LOG_TAG = "[storage:todos]";
const TODO_PENDING_SYNC_KEY = CACHE_KEYS.TODOS_PENDING_SYNC;
const emit = () => window.dispatchEvent(new Event(TODO_CHANGED_EVENT));

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

export type TodoCompletionHistoryEntry = {
  id: string;
  date: string;
  completed: boolean;
};

// ── Cache ──────────────────────────────────────────────────────────────────
export const TODO_CACHE_KEY = CACHE_KEYS.TODOS;
export const TODO_COMPLETION_HISTORY_KEY = CACHE_KEYS.TODOS_COMPLETION_HISTORY;

function readTodoCache(): Todo[] | null {
  try {
    const raw = localStorage.getItem(TODO_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : null;
  } catch {
    return null;
  }
}

function writeTodoCache(todos: Todo[]): void {
  try {
    assertRegisteredCacheWrite(TODO_CACHE_KEY);
    localStorage.setItem(TODO_CACHE_KEY, JSON.stringify(todos));
  } catch {
    // ignore
  }
}

function writePendingSync(entries: Array<{ op: string; payload: unknown; at: string }>): void {
  try {
    assertRegisteredCacheWrite(TODO_PENDING_SYNC_KEY);
    localStorage.setItem(TODO_PENDING_SYNC_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function markPendingSync(op: string, payload: unknown): void {
  try {
    const raw = localStorage.getItem(TODO_PENDING_SYNC_KEY);
    const current = raw ? (JSON.parse(raw) as Array<{ op: string; payload: unknown; at: string }>) : [];
    current.push({ op, payload, at: new Date().toISOString() });
    writePendingSync(current);
  } catch {
    // ignore
  }
}

function clearPendingSync(): void {
  try {
    localStorage.removeItem(TODO_PENDING_SYNC_KEY);
  } catch {
    // ignore
  }
}

function readTodoCompletionHistory(): TodoCompletionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(TODO_COMPLETION_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as TodoCompletionHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeTodoCompletionHistory(entries: TodoCompletionHistoryEntry[]): void {
  try {
    assertRegisteredCacheWrite(TODO_COMPLETION_HISTORY_KEY);
    localStorage.setItem(TODO_COMPLETION_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function recordTodoCompletion(id: string, completed: boolean): void {
  const today = getLocalDateKey();
  const entries = readTodoCompletionHistory().filter(
    (entry) => !(entry.id === id && entry.date === today),
  );

  entries.push({ id, date: today, completed });
  writeTodoCompletionHistory(entries);
}

/** Synchronous seed — returns todos from cache. Zero network. */
export function seedTodos(): Todo[] {
  return readTodoCache() ?? [];
}

export async function listTodos(): Promise<Todo[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return readTodoCache() ?? [];

  const cached = readTodoCache();
  if (cached) {
    supabase
      .from("todos")
      .select("id,text,done,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) writeTodoCache(data as Todo[]);
      });
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

export async function addTodo(text: string): Promise<StorageMutationResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    markPendingSync("add", { text });
    return { ok: false, error: "Not signed in. Unable to save todo." };
  }

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Todo text is required." };

  const { data, error } = await supabase
    .from("todos")
    .insert({ user_id: user.id, text: trimmed, done: false })
    .select("id,text,done,created_at")
    .single();

  if (error) {
    markPendingSync("add", { text: trimmed });
    const result = storageError(error);
    console.error(`${LOG_TAG} add failed`, { error: result.error, userId: user.id });
    emit();
    return result;
  }

  writeTodoCache([data as Todo, ...(readTodoCache() ?? [])]);
  clearPendingSync();
  console.debug(`${LOG_TAG} add success`, { todoId: data?.id, userId: user.id });

  emit();
  return storageOk();
}

export async function setTodoDone(id: string, done: boolean): Promise<StorageMutationResult> {
  const { error } = await supabase.from("todos").update({ done }).eq("id", id);

  if (error) {
    markPendingSync("setDone", { id, done });
    const result = storageError(error);
    console.error(`${LOG_TAG} set done failed`, { id, done, error: result.error });
    return result;
  }

  recordTodoCompletion(id, done);

  const cached = readTodoCache();
  if (cached) {
    writeTodoCache(cached.map((todo) => (todo.id === id ? { ...todo, done } : todo)));
  }
  clearPendingSync();
  emit();
  return storageOk();
}

export async function deleteTodo(id: string): Promise<StorageMutationResult> {
  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) {
    markPendingSync("delete", { id });
    const result = storageError(error);
    console.error(`${LOG_TAG} delete failed`, { id, error: result.error });
    return result;
  }

  const cached = readTodoCache();
  if (cached) {
    writeTodoCache(cached.filter((todo) => todo.id !== id));
  }
  clearPendingSync();
  emit();
  return storageOk();
}

export async function clearCompleted(): Promise<StorageMutationResult> {
  const { error } = await supabase.from("todos").delete().eq("done", true);

  if (error) {
    markPendingSync("clearCompleted", { done: true });
    const result = storageError(error);
    console.error(`${LOG_TAG} clear completed failed`, { error: result.error });
    return result;
  }

  const cached = readTodoCache();
  if (cached) {
    writeTodoCache(cached.filter((todo) => !todo.done));
  }
  clearPendingSync();
  emit();
  return storageOk();
}

export function getTodoWeeklySummary(
  weekStart: string,
  weekEnd: string,
  todos: Todo[],
): {
  completedThisWeek: number | null;
  totalCreatedThisWeek: number;
  completedTotal: number;
  openCount: number;
  dataCompleteness: "complete" | "partial";
} {
  const history = readTodoCompletionHistory().filter(
    (entry) => entry.date >= weekStart && entry.date <= weekEnd,
  );

  const completedThisWeekFromHistory = new Set(
    history
      .filter((entry) => entry.completed)
      .map((entry) => `${entry.id}:${entry.date}`),
  ).size;

  const totalCreatedThisWeek = todos.filter(
    (todo) =>
      typeof todo.created_at === "string" &&
      todo.created_at.slice(0, 10) >= weekStart,
  ).length;

  const completedTotal = todos.filter((todo) => todo.done).length;
  const openCount = todos.filter((todo) => !todo.done).length;

  return {
    completedThisWeek:
      history.length > 0 ? completedThisWeekFromHistory : null,
    totalCreatedThisWeek,
    completedTotal,
    openCount,
    dataCompleteness: history.length > 0 ? "complete" : "partial",
  };
}

export type TodoItem = Todo;

export async function toggleTodo(id: string): Promise<StorageMutationResult> {
  const { data, error } = await supabase
    .from("todos")
    .select("done")
    .eq("id", id)
    .single();

  if (error) {
    const result = storageError(error);
    console.error(`${LOG_TAG} toggle select failed`, { id, error: result.error });
    return result;
  }

  const nextDone = !data?.done;

  const { error: updateError } = await supabase
    .from("todos")
    .update({ done: nextDone })
    .eq("id", id);

  if (updateError) {
    markPendingSync("toggle", { id });
    const result = storageError(updateError);
    console.error(`${LOG_TAG} toggle update failed`, { id, error: result.error });
    return result;
  }

  recordTodoCompletion(id, nextDone);

  const cached = readTodoCache();
  if (cached) {
    writeTodoCache(cached.map((todo) => (todo.id === id ? { ...todo, done: nextDone } : todo)));
  }
  clearPendingSync();
  emit();
  return storageOk();
}

export const loadTodos = listTodos;
