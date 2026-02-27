import { useEffect, useState } from "react";
import { listTodos, TODO_CHANGED_EVENT, type Todo } from "@/features/todos/todoStorage";

export function useTodoDashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const sync = async () => {
      setLoading(true);
      const next = await listTodos();
      if (!alive) return;
      setTodos(next);
      setLoading(false);
    };

    sync();
    window.addEventListener(TODO_CHANGED_EVENT, sync);
    return () => {
      alive = false;
      window.removeEventListener(TODO_CHANGED_EVENT, sync);
    };
  }, []);

  return { todos, loading };
}