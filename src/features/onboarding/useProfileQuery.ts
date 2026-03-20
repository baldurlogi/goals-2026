import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import {
  loadProfile,
  saveProfile,
  seedProfileCache,
  type UserProfile,
} from "@/features/onboarding/profileStorage";
import { queryKeys } from "@/lib/queryKeys";

export function useProfileQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<UserProfile | null>({
    queryKey: queryKeys.profile(userId),
    queryFn: () => loadProfile(userId),
    enabled: authReady && Boolean(userId),
    staleTime: 1000 * 60 * 5,
    placeholderData: userId ? seedProfileCache(userId) : undefined,
  });
}

export function useProfileState() {
  const { authReady, userId } = useAuth();
  const query = useProfileQuery();

  const isWaitingForUserId = authReady && !userId;
  const hasUserId = Boolean(userId);

  return {
    ...query,
    profile: query.data ?? null,
    authReady,
    isAuthLoading: !authReady,
    isProfileLoading:
      isWaitingForUserId ||
      (hasUserId && ((query.isLoading && !query.data) || query.isPlaceholderData)),
    isRefreshingProfile: hasUserId && query.isFetching && !!query.data,
    isMissingProfile:
      hasUserId &&
      !isWaitingForUserId &&
      !query.isLoading &&
      !query.data &&
      !query.error,
  };
}

export function useSaveProfileMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<Omit<UserProfile, "id">>) => {
      return saveProfile(userId, patch);
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