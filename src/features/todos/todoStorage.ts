import { supabase } from "@/lib/supabaseClient";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import {
  storageError,
  storageOk,
  type StorageMutationResult,
} from "@/lib/storageResult";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import {
  getActiveUserId,
  getScopedStorageItem,
  scopedKey,
} from "@/lib/activeUser";

export const TODO_CHANGED_EVENT = "todos:changed";
const LOG_TAG = "[storage:todos]";
const TODO_PENDING_SYNC_KEY = CACHE_KEYS.TODOS_PENDING_SYNC;

function todoCacheKey(userId: string | null) {
  return scopedKey(TODO_CACHE_KEY, userId);
}

function todoPendingSyncKey(userId: string | null) {
  return scopedKey(TODO_PENDING_SYNC_KEY, userId);
}

function todoHistoryKey(userId: string | null) {
  return scopedKey(TODO_COMPLETION_HISTORY_KEY, userId);
}
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

function readTodoCache(
  userId: string | null = getActiveUserId(),
): Todo[] | null {
  try {
    const raw = getScopedStorageItem(TODO_CACHE_KEY, userId);
    return raw ? (JSON.parse(raw) as Todo[]) : null;
  } catch {
    return null;
  }
}

function writeTodoCache(
  todos: Todo[],
  userId: string | null = getActiveUserId(),
): void {
  try {
    const key = todoCacheKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(todos));
  } catch {
    // ignore
  }
}

function writePendingSync(
  entries: Array<{ op: string; payload: unknown; at: string }>,
  userId: string | null = getActiveUserId(),
): void {
  try {
    const key = todoPendingSyncKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function markPendingSync(
  op: string,
  payload: unknown,
  userId: string | null = getActiveUserId(),
): void {
  try {
    const raw = getScopedStorageItem(TODO_PENDING_SYNC_KEY, userId);
    const current = raw
      ? (JSON.parse(raw) as Array<{ op: string; payload: unknown; at: string }>)
      : [];
    current.push({ op, payload, at: new Date().toISOString() });
    writePendingSync(current, userId);
  } catch {
    // ignore
  }
}

function clearPendingSync(userId: string | null = getActiveUserId()): void {
  try {
    localStorage.removeItem(todoPendingSyncKey(userId));
  } catch {
    // ignore
  }
}

function readTodoCompletionHistory(
  userId: string | null = getActiveUserId(),
): TodoCompletionHistoryEntry[] {
  try {
    const raw = getScopedStorageItem(TODO_COMPLETION_HISTORY_KEY, userId);
    return raw ? (JSON.parse(raw) as TodoCompletionHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function loadTodoCompletionHistory(
  userId: string | null = getActiveUserId(),
): TodoCompletionHistoryEntry[] {
  return readTodoCompletionHistory(userId);
}

function writeTodoCompletionHistory(
  entries: TodoCompletionHistoryEntry[],
  userId: string | null = getActiveUserId(),
): void {
  try {
    const key = todoHistoryKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function recordTodoCompletion(
  id: string,
  completed: boolean,
  userId: string | null = getActiveUserId(),
): void {
  const today = getLocalDateKey();
  const entries = readTodoCompletionHistory(userId).filter(
    (entry) => !(entry.id === id && entry.date === today),
  );

  entries.push({ id, date: today, completed });
  writeTodoCompletionHistory(entries, userId);
}

/** Synchronous seed — returns todos from the query seed mirror. Zero network. */
export function seedTodoCache(userId: string | null): Todo[] {
  return readTodoCache(userId) ?? [];
}

export async function loadTodos(userId: string | null = getActiveUserId()): Promise<Todo[]> {
  if (!userId) return readTodoCache(null) ?? [];

  const cached = readTodoCache(userId);
  if (cached) {
    supabase
      .from("todos")
      .select("id,text,done,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) writeTodoCache(data as Todo[], userId);
      });
    return cached;
  }

  const { data, error } = await supabase
    .from("todos")
    .select("id,text,done,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("listTodos error:", error);
    return [];
  }

  const todos = (data ?? []) as Todo[];
  writeTodoCache(todos, userId);
  return todos;
}

export async function addTodo(userId: string | null, text: string): Promise<StorageMutationResult> {
  if (!userId) {
    markPendingSync("add", { text }, null);
    return { ok: false, error: "Not signed in. Unable to save todo." };
  }

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Todo text is required." };

  const { data, error } = await supabase
    .from("todos")
    .insert({ user_id: userId, text: trimmed, done: false })
    .select("id,text,done,created_at")
    .single();

  if (error) {
    markPendingSync("add", { text: trimmed }, userId);
    const result = storageError(error);
    console.error(`${LOG_TAG} add failed`, {
      error: result.error,
      userId,
    });
    emit();
    return result;
  }

  writeTodoCache([data as Todo, ...(readTodoCache(userId) ?? [])], userId);
  clearPendingSync(userId);
  console.debug(`${LOG_TAG} add success`, {
    todoId: data?.id,
    userId,
  });

  emit();
  return storageOk();
}

export async function setTodoDone(
  userId: string | null,
  id: string,
  done: boolean,
): Promise<StorageMutationResult> {
  if (!userId)
    return { ok: false, error: "Not signed in. Unable to update todo." };

  const { error } = await supabase
    .from("todos")
    .update({ done })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    markPendingSync("setDone", { id, done }, userId);
    const result = storageError(error);
    console.error(`${LOG_TAG} set done failed`, {
      id,
      done,
      error: result.error,
    });
    return result;
  }

  recordTodoCompletion(id, done, userId);

  const cached = readTodoCache(userId);
  if (cached) {
    writeTodoCache(
      cached.map((todo) => (todo.id === id ? { ...todo, done } : todo)),
      userId,
    );
  }
  clearPendingSync(userId);
  emit();
  return storageOk();
}

export async function deleteTodo(userId: string | null, id: string): Promise<StorageMutationResult> {
  if (!userId)
    return { ok: false, error: "Not signed in. Unable to delete todo." };

  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    markPendingSync("delete", { id }, userId);
    const result = storageError(error);
    console.error(`${LOG_TAG} delete failed`, { id, error: result.error });
    return result;
  }

  const cached = readTodoCache(userId);
  if (cached) {
    writeTodoCache(
      cached.filter((todo) => todo.id !== id),
      userId,
    );
  }
  clearPendingSync(userId);
  emit();
  return storageOk();
}

export async function clearCompleted(userId: string | null): Promise<StorageMutationResult> {
  if (!userId)
    return { ok: false, error: "Not signed in. Unable to clear todos." };

  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("done", true)
    .eq("user_id", userId);

  if (error) {
    markPendingSync("clearCompleted", { done: true }, userId);
    const result = storageError(error);
    console.error(`${LOG_TAG} clear completed failed`, { error: result.error });
    return result;
  }

  const cached = readTodoCache(userId);
  if (cached) {
    writeTodoCache(
      cached.filter((todo) => !todo.done),
      userId,
    );
  }
  clearPendingSync(userId);
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
    completedThisWeek: history.length > 0 ? completedThisWeekFromHistory : null,
    totalCreatedThisWeek,
    completedTotal,
    openCount,
    dataCompleteness: history.length > 0 ? "complete" : "partial",
  };
}

export type TodoItem = Todo;

export async function toggleTodo(userId: string | null, id: string): Promise<StorageMutationResult> {
  if (!userId)
    return { ok: false, error: "Not signed in. Unable to update todo." };

  const { data, error } = await supabase
    .from("todos")
    .select("done")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    const result = storageError(error);
    console.error(`${LOG_TAG} toggle select failed`, {
      id,
      error: result.error,
    });
    return result;
  }

  const nextDone = !data?.done;

  const { error: updateError } = await supabase
    .from("todos")
    .update({ done: nextDone })
    .eq("id", id)
    .eq("user_id", userId);

  if (updateError) {
    markPendingSync("toggle", { id }, userId);
    const result = storageError(updateError);
    console.error(`${LOG_TAG} toggle update failed`, {
      id,
      error: result.error,
    });
    return result;
  }

  recordTodoCompletion(id, nextDone, userId);

  const cached = readTodoCache(userId);
  if (cached) {
    writeTodoCache(
      cached.map((todo) =>
        todo.id === id ? { ...todo, done: nextDone } : todo,
      ),
      userId,
    );
  }
  clearPendingSync(userId);
  emit();
  return storageOk();
}


export const listTodos = loadTodos;
export const seedTodos = seedTodoCache;
