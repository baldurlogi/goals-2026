import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  deleteUserGoal,
  loadUserGoals,
  saveUserGoal,
  seedUserGoals,
} from "./userGoalStorage";
import type { UserGoal } from "./goalTypes";

export function useGoalsQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<UserGoal[]>({
    queryKey: queryKeys.goals(userId),
    queryFn: () => loadUserGoals(),
    enabled: authReady,
    initialData: userId ? seedUserGoals() : [],
  });
}

export function useSaveGoalMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveUserGoal,
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
    mutationFn: deleteUserGoal,
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
