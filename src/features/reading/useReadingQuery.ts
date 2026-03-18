import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  loadReadingInputs,
  saveReadingInputs,
  seedReadingCache,
} from "./readingStorage";
import type { ReadingInputs } from "./readingTypes";

export function useReadingQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<ReadingInputs>({
    queryKey: queryKeys.reading(userId),
    queryFn: () => loadReadingInputs(userId),
    enabled: authReady,
    initialData: seedReadingCache(userId),
  });
}

export function useSaveReadingMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: ReadingInputs) => saveReadingInputs(userId, value),
    onSuccess: async (_, value) => {
      queryClient.setQueryData(queryKeys.reading(userId), value);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.reading(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardReading(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardLifeProgress(userId) }),
      ]);
    },
  });
}
