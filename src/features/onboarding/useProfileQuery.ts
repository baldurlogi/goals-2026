import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import {
  loadProfile,
  readProfileCache,
  saveProfile,
  type UserProfile,
} from "@/features/onboarding/profileStorage";
import { queryKeys } from "@/lib/queryKeys";

export function useProfileQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<UserProfile | null>({
    queryKey: queryKeys.profile(userId),
    queryFn: () => loadProfile(),
    enabled: authReady,
    staleTime: 1000 * 60 * 5,
    initialData: userId ? readProfileCache(userId) : null,
  });
}

export function useSaveProfileMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveProfile,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.enabledModules(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profileDerivedModules(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tier(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardTier(userId) }),
      ]);
    },
  });
}
