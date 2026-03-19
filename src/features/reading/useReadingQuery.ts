import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  DEFAULT_READING_INPUTS,
  loadReadingInputs,
  saveReadingInputs,
  seedReadingCache,
} from "./readingStorage";
import type { ReadingInputs } from "./readingTypes";

export function useReadingQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<ReadingInputs>({
    queryKey: queryKeys.reading(userId),
    queryFn: async () => {
      if (!userId) return DEFAULT_READING_INPUTS;
      return loadReadingInputs(userId);
    },
    enabled: authReady && Boolean(userId),
    initialData: userId ? seedReadingCache(userId) : DEFAULT_READING_INPUTS,
    placeholderData: (previous) => previous ?? DEFAULT_READING_INPUTS,
  });
}

export function useSaveReadingMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    ReadingInputs,
    Error,
    ReadingInputs,
    { previous: ReadingInputs }
  >({
    mutationFn: (value: ReadingInputs) => saveReadingInputs(userId, value),
    onMutate: async (value) => {
      const previous =
        queryClient.getQueryData<ReadingInputs>(queryKeys.reading(userId)) ??
        DEFAULT_READING_INPUTS;

      queryClient.setQueryData(queryKeys.reading(userId), value);

      return { previous };
    },
    onError: (_error, _value, context) => {
      if (!context) return;
      queryClient.setQueryData(queryKeys.reading(userId), context.previous);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.reading(userId), saved);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardReading(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardLifeProgress(userId),
        }),
      ]);
    },
  });
}