import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  GoalRemotePersistenceError,
  deleteUserGoal,
  loadUserGoals,
  saveUserGoal,
  seedGoalCache,
} from "./userGoalStorage";
import type { UserGoal } from "./goalTypes";

function upsertGoal(goals: UserGoal[], goal: UserGoal): UserGoal[] {
  const index = goals.findIndex((item) => item.id === goal.id);
  if (index === -1) {
    return [...goals, goal];
  }

  const next = [...goals];
  next[index] = goal;
  return next;
}

export function useGoalsQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<UserGoal[]>({
    queryKey: queryKeys.goals(userId),
    queryFn: () => loadUserGoals(userId),
    enabled: authReady && Boolean(userId),
    initialData: userId ? seedGoalCache(userId) : [],
  });
}

export function useSaveGoalMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goal: UserGoal) => saveUserGoal(userId, goal),

    onMutate: async (goal) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals(userId) });

      const previousGoals =
        queryClient.getQueryData<UserGoal[]>(queryKeys.goals(userId)) ??
        (userId ? seedGoalCache(userId) : []);

      const nextGoals = upsertGoal(previousGoals, goal);
      queryClient.setQueryData(queryKeys.goals(userId), nextGoals);

      return { previousGoals };
    },

    onError: (error, _goal, context) => {
      if (
        error instanceof GoalRemotePersistenceError &&
        error.localCacheWriteSucceeded
      ) {
        return;
      }

      if (context?.previousGoals) {
        queryClient.setQueryData(queryKeys.goals(userId), context.previousGoals);
      }
    },

    onSuccess: async (_status, goal) => {
      const existing =
        queryClient.getQueryData<UserGoal[]>(queryKeys.goals(userId)) ?? [];
      queryClient.setQueryData(queryKeys.goals(userId), upsertGoal(existing, goal));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardGoals(userId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardLifeProgress(userId),
        }),
      ]);
    },
  });
}

export function useDeleteGoalMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) => deleteUserGoal(userId, goalId),

    onMutate: async (goalId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.goals(userId) });

      const previousGoals =
        queryClient.getQueryData<UserGoal[]>(queryKeys.goals(userId)) ??
        (userId ? seedGoalCache(userId) : []);

      queryClient.setQueryData(
        queryKeys.goals(userId),
        previousGoals.filter((goal) => goal.id !== goalId),
      );

      return { previousGoals };
    },

    onError: (error, _goalId, context) => {
      if (
        error instanceof GoalRemotePersistenceError &&
        error.localCacheWriteSucceeded
      ) {
        return;
      }

      if (context?.previousGoals) {
        queryClient.setQueryData(queryKeys.goals(userId), context.previousGoals);
      }
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardGoals(userId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardLifeProgress(userId),
        }),
      ]);
    },
  });
}