import { supabase } from "@/lib/supabaseClient";

export const TODO_CHANGED_EVENT = "todos:changed";
const emit = () => window.dispatchEvent(new Event(TODO_CHANGED_EVENT));

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

export async function listTodos(): Promise<Todo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // With RLS, you can omit user_id filters and just select your rows
  const { data, error } = await supabase
    .from("todos")
    .select("id,text,done,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("listTodos error:", error);
    return [];
  }

  return (data ?? []) as Todo[];
}

export async function addTodo(text: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const trimmed = text.trim();
  if (!trimmed) return;

  const { error } = await supabase
    .from("todos")
    .insert({ user_id: user.id, text: trimmed, done: false });

  if (error) console.warn("addTodo error:", error);
  emit();
}

export async function setTodoDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from("todos")
    .update({ done })
    .eq("id", id);

  if (error) console.warn("setTodoDone error:", error);
  emit();
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("id", id);

  if (error) console.warn("deleteTodo error:", error);
  emit();
}

export async function clearCompleted(): Promise<void> {
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("done", true);

  if (error) console.warn("clearCompleted error:", error);
  emit();
}


export type TodoItem = Todo;

export async function toggleTodo(id: string): Promise<void> {
  // Read current value
  const { data, error } = await supabase
    .from("todos")
    .select("done")
    .eq("id", id)
    .single();

  if (error) {
    console.warn("toggleTodo select error:", error);
    return;
  }

  const nextDone = !data?.done;

  const { error: updateError } = await supabase
    .from("todos")
    .update({ done: nextDone })
    .eq("id", id);

  if (updateError) console.warn("toggleTodo update error:", updateError);
  emit();
}

// Keep this, but it’s async:
export const loadTodos = listTodos;