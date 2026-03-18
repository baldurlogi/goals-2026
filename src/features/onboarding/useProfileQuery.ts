import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import {
  loadProfile,
  normalizeUserProfile,
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

export function useProfileState() {
  const { authReady } = useAuth();
  const query = useProfileQuery();

  return {
    ...query,
    profile: query.data ?? null,
    authReady,
    isAuthLoading: !authReady,
    isProfileLoading: authReady && query.isLoading && !query.data,
    isRefreshingProfile: authReady && query.isFetching && !!query.data,
    isMissingProfile: authReady && !query.isLoading && !query.data && !query.error,
  };
}

export function useSaveProfileMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<Omit<UserProfile, "id">>) => {
      await saveProfile(patch);
      const cached = userId ? readProfileCache(userId) : null;
      return cached ? normalizeUserProfile(cached) : null;
    },
    onSuccess: async (nextProfile) => {
      if (userId && nextProfile) {
        queryClient.setQueryData(queryKeys.profile(userId), nextProfile);
      }

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
