import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  deleteUserGoal,
  loadUserGoals,
  saveUserGoal,
  seedGoalCache,
} from "./userGoalStorage";
import type { UserGoal } from "./goalTypes";

export function useGoalsQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<UserGoal[]>({
    queryKey: queryKeys.goals(userId),
    queryFn: () => loadUserGoals(userId),
    enabled: authReady,
    initialData: seedGoalCache(userId),
  });
}

export function useSaveGoalMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goal: UserGoal) => saveUserGoal(userId, goal),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardGoals(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardLifeProgress(userId) }),
      ]);
    },
  });
}

export function useDeleteGoalMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) => deleteUserGoal(userId, goalId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardGoals(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardLifeProgress(userId) }),
      ]);
    },
  });
}
