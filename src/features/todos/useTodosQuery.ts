import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  addTodo,
  clearCompleted,
  deleteTodo,
  listTodos,
  seedTodos,
  toggleTodo,
  type TodoItem,
} from "./todoStorage";

export function useTodosQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<TodoItem[]>({
    queryKey: queryKeys.todos(userId),
    queryFn: () => listTodos(),
    enabled: authReady,
    initialData: userId ? seedTodos() : [],
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
  const invalidate = useTodosInvalidation();
  return useMutation({ mutationFn: addTodo, onSuccess: invalidate });
}
export function useToggleTodoMutation() {
  const invalidate = useTodosInvalidation();
  return useMutation({ mutationFn: toggleTodo, onSuccess: invalidate });
}
export function useDeleteTodoMutation() {
  const invalidate = useTodosInvalidation();
  return useMutation({ mutationFn: deleteTodo, onSuccess: invalidate });
}
export function useClearCompletedMutation() {
  const invalidate = useTodosInvalidation();
  return useMutation({ mutationFn: clearCompleted, onSuccess: invalidate });
}
