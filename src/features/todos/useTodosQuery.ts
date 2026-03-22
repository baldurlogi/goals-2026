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

function cloneTodos(todos: TodoItem[]) {
  return todos.map((todo) => ({ ...todo }));
}

export function useTodosQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<TodoItem[]>({
    queryKey: queryKeys.todos(userId),
    queryFn: async () => {
      if (!userId) return [];
      return loadTodos(userId);
    },
    enabled: authReady && Boolean(userId),
    initialData: userId ? seedTodoCache(userId) : [],
    placeholderData: (previous) => previous ?? [],
  });
}

function useTodosInvalidation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.todos(userId) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboardTodos(userId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboardLifeProgress(userId),
      }),
    ]);
  };
}

export function useAddTodoMutation() {
  const { userId } = useAuth();
  const invalidate = useTodosInvalidation();

  return useMutation({
    mutationFn: (text: string) => addTodo(userId, text),
    onSuccess: invalidate,
  });
}

export function useToggleTodoMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = useTodosInvalidation();

  return useMutation<
    Awaited<ReturnType<typeof toggleTodo>>,
    Error,
    string,
    { previous: TodoItem[] }
  >({
    mutationFn: (id: string) => toggleTodo(userId, id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos(userId) });

      const previous =
        cloneTodos(
          queryClient.getQueryData<TodoItem[]>(queryKeys.todos(userId)) ?? [],
        );

      queryClient.setQueryData<TodoItem[]>(
        queryKeys.todos(userId),
        previous.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo,
        ),
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (!context) return;
      queryClient.setQueryData(queryKeys.todos(userId), context.previous);
    },
    onSettled: invalidate,
  });
}

export function useDeleteTodoMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = useTodosInvalidation();

  return useMutation<
    Awaited<ReturnType<typeof deleteTodo>>,
    Error,
    string,
    { previous: TodoItem[] }
  >({
    mutationFn: (id: string) => deleteTodo(userId, id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos(userId) });

      const previous =
        cloneTodos(
          queryClient.getQueryData<TodoItem[]>(queryKeys.todos(userId)) ?? [],
        );

      queryClient.setQueryData<TodoItem[]>(
        queryKeys.todos(userId),
        previous.filter((todo) => todo.id !== id),
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (!context) return;
      queryClient.setQueryData(queryKeys.todos(userId), context.previous);
    },
    onSettled: invalidate,
  });
}

export function useClearCompletedMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = useTodosInvalidation();

  return useMutation<
    Awaited<ReturnType<typeof clearCompleted>>,
    Error,
    void,
    { previous: TodoItem[] }
  >({
    mutationFn: () => clearCompleted(userId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos(userId) });

      const previous =
        cloneTodos(
          queryClient.getQueryData<TodoItem[]>(queryKeys.todos(userId)) ?? [],
        );

      queryClient.setQueryData<TodoItem[]>(
        queryKeys.todos(userId),
        previous.filter((todo) => !todo.done),
      );

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(queryKeys.todos(userId), context.previous);
    },
    onSettled: invalidate,
  });
}
