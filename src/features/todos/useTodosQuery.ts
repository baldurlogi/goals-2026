import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  addTodo,
  clearCompleted,
  deleteTodo,
  loadTodos,
  seedTodoCache,
  toggleTodo,
  type TodoItem,
} from "./todoStorage";

export function useTodosQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<TodoItem[]>({
    queryKey: queryKeys.todos(userId),
    queryFn: () => loadTodos(userId),
    enabled: authReady,
    initialData: seedTodoCache(userId),
  });
}

function useTodosInvalidation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.todos(userId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardTodos(userId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardLifeProgress(userId) }),
    ]);
  };
}

export function useAddTodoMutation() {
  const { userId } = useAuth();
  const invalidate = useTodosInvalidation();
  return useMutation({ mutationFn: (text: string) => addTodo(userId, text), onSuccess: invalidate });
}
export function useToggleTodoMutation() {
  const { userId } = useAuth();
  const invalidate = useTodosInvalidation();
  return useMutation({ mutationFn: (id: string) => toggleTodo(userId, id), onSuccess: invalidate });
}
export function useDeleteTodoMutation() {
  const { userId } = useAuth();
  const invalidate = useTodosInvalidation();
  return useMutation({ mutationFn: (id: string) => deleteTodo(userId, id), onSuccess: invalidate });
}
export function useClearCompletedMutation() {
  const { userId } = useAuth();
  const invalidate = useTodosInvalidation();
  return useMutation({ mutationFn: () => clearCompleted(userId), onSuccess: invalidate });
}
