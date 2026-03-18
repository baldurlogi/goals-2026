import { useTodosQuery } from '@/features/todos/useTodosQuery';

const PREVIEW_LIMIT = 5;

export function useTodoDashboard() {
  const { data: todos = [], isLoading: loading } = useTodosQuery();

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
