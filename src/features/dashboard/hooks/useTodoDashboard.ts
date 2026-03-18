import { useCallback, useState } from 'react';
import {
  loadTodos,
  seedTodos,
  TODO_CHANGED_EVENT,
  type TodoItem,
} from '@/features/todos/todoStorage';
import { useDashboardLoadSubscription } from '@/features/dashboard/hooks/useDashboardLoadSubscription';

const PREVIEW_LIMIT = 5;
const TODO_EVENTS = [TODO_CHANGED_EVENT] as const;

export function useTodoDashboard() {
  const seeded = seedTodos();
  const [todos, setTodos] = useState<TodoItem[]>(seeded);
  const [loading, setLoading] = useState(seeded.length === 0);

  const load = useCallback(async () => {
    try {
      const fresh = await loadTodos();
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
    storageKeys: [],
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
