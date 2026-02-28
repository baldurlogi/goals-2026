import { useEffect, useState } from "react";
import {
  loadTodos,
  TODO_CHANGED_EVENT,
  type TodoItem,
} from "@/features/todos/todoStorage";

const CACHE_KEY    = "cache:todos:v1";
const PREVIEW_LIMIT = 5;

function readCache(): TodoItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useTodoDashboard() {
  const [todos,   setTodos]   = useState<TodoItem[]>(readCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const fresh = await loadTodos();
      if (!cancelled) {
        setTodos(fresh);
        setLoading(false);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch {}
      }
    }

    fetch();

    const sync = () => fetch();
    window.addEventListener(TODO_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener(TODO_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const incomplete = todos.filter((t) => !t.done);
  const preview    = incomplete.slice(0, PREVIEW_LIMIT);
  const hasMore    = incomplete.length > PREVIEW_LIMIT;
  const extraCount = incomplete.length - PREVIEW_LIMIT;
  const doneCount  = todos.filter((t) => t.done).length;

  return { preview, incomplete, hasMore, extraCount, doneCount, total: todos.length, loading };
}