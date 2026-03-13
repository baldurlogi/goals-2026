import { useEffect, useState } from "react";
import {
  loadTodos,
  TODO_CHANGED_EVENT,
  type TodoItem,
} from "@/features/todos/todoStorage";

const CACHE_KEY = "cache:todos:v1";
const PREVIEW_LIMIT = 5;

function readCache(): TodoItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useTodoDashboard() {
  const [todos, setTodos] = useState<TodoItem[]>(() => readCache());
  const [loading, setLoading] = useState(() => readCache().length === 0);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const fresh = await loadTodos();

        if (!cancelled) {
          setTodos(fresh);
          setLoading(false);

          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
          } catch (e) {
            console.warn("todo cache write failed", e);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLoading(false);
        }
        console.warn("todo dashboard load failed", e);
      }
    }

    void fetch();

    const sync = () => {
      void fetch();
    };

    window.addEventListener(TODO_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      cancelled = true;
      window.removeEventListener(TODO_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

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