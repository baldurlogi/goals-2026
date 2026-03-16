import { useCallback, useState } from 'react';
import {
  loadTodos,
  TODO_CHANGED_EVENT,
  TODO_CACHE_KEY,
  type TodoItem,
} from '@/features/todos/todoStorage';
import { readCache, writeCache, loadWithWriteThrough, hasCache } from '@/lib/cache';
import { useDashboardLoadSubscription } from '@/features/dashboard/hooks/useDashboardLoadSubscription';

const PREVIEW_LIMIT = 5;
const TODO_EVENTS = [TODO_CHANGED_EVENT] as const;
const TODO_STORAGE_KEYS = [TODO_CACHE_KEY] as const;

export function useTodoDashboard() {
  const [todos, setTodos] = useState<TodoItem[]>(() => readCache(TODO_CACHE_KEY, []));
  const [loading, setLoading] = useState(() => !hasCache(TODO_CACHE_KEY));

  const load = useCallback(async () => {
    try {
      const fresh = await loadWithWriteThrough(loadTodos, (value) =>
        writeCache(TODO_CACHE_KEY, value),
      );
      setTodos(fresh);
    } catch (e) {
      console.warn('todo dashboard load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useDashboardLoadSubscription({
    load,
    events: TODO_EVENTS,
    storageKeys: TODO_STORAGE_KEYS,
  });

  const incomplete = todos.filter((t) => !t.done);
  const preview = incomplete.slice(0, PREVIEW_LIMIT);
  const hasMore = incomplete.length > PREVIEW_LIMIT;
  const extraCount = Math.max(0, incomplete.length - PREVIEW_LIMIT);
  const doneCount = todos.filter((t) => t.done).length;

  return {
    preview,
    incomplete,
    hasMore,
    extraCount,
    doneCount,
    total: todos.length,
    loading,
  };
}
