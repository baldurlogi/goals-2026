export const TODO_CHANGED_EVENT = "todo:changed"
const STORAGE_KEY = "todos_v1"

export type TodoItem = {
    id: string;
    text: string;
    done: boolean;
    createdAt: number; // ms timestamp
};

function emit() {
    window.dispatchEvent(new Event(TODO_CHANGED_EVENT));
}

export function loadTodos(): TodoItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as TodoItem[]) : [];
    } catch {
        return [];
    }
}

function saveTodos(items: TodoItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    emit();
}

export function addTodo(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    const items = loadTodos();
    items.unshift({ id: crypto.randomUUID(), text: trimmed, done: false, createdAt: Date.now() });
    saveTodos(items);
}

export function toggleTodo(id: string): void {
    const items = loadTodos().map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
    );
    saveTodos(items);
}

export function deleteTodo(id: string): void {
    saveTodos(loadTodos().filter((t) => t.id !== id));
}

export function clearCompleted(): void {
    saveTodos(loadTodos().filter((t) => !t.done));
}
