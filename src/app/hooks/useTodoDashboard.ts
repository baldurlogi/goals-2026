import { loadTodos, TODO_CHANGED_EVENT, type TodoItem } from "@/features/todos/todoStorage";
import { useEffect, useState } from "react";

const PREVIEW_LIMIT = 5;

export function useTodoDashboard() {
    const [todos, setTodos] = useState<TodoItem[]>(() => loadTodos());

    useEffect(() => {
        const sync = () => setTodos(loadTodos());
        window.addEventListener(TODO_CHANGED_EVENT, sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener(TODO_CHANGED_EVENT, sync);
            window.removeEventListener("storage", sync)
        };
    }, []);

    const incomplete = todos.filter((t) => !t.done);
    const preview = incomplete.slice(0, PREVIEW_LIMIT);
    const hasMore = incomplete.length > PREVIEW_LIMIT;
    const extraCount = incomplete.length - PREVIEW_LIMIT;
    const doneCount = todos.filter((t) => t.done).length;

    return { preview, incomplete, hasMore, extraCount, doneCount, total: todos.length};
}
