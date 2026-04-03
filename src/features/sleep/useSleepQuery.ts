import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  loadRecentSleepRecoveryEntries,
  loadSleepRecoveryEntry,
  saveSleepRecoveryEntry,
} from "./sleepStorage";
import {
  createEmptySleepRecoveryEntry,
  type SleepRecoveryEntry,
} from "./sleepTypes";

type SaveSleepEntryVariables = {
  value: SleepRecoveryEntry;
};

export function useSleepEntryQuery(logDate: string) {
  const { userId, authReady } = useAuth();

  return useQuery<SleepRecoveryEntry>({
    queryKey: queryKeys.sleepLog(userId, logDate),
    queryFn: async () => {
      if (!userId) return createEmptySleepRecoveryEntry("", logDate);
      return loadSleepRecoveryEntry(userId, logDate);
    },
    enabled: authReady && Boolean(userId) && Boolean(logDate),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useSaveSleepEntryMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    SleepRecoveryEntry,
    Error,
    SaveSleepEntryVariables,
    { previous?: SleepRecoveryEntry; queryKey: ReturnType<typeof queryKeys.sleepLog> }
  >({
    mutationFn: async ({ value }) => {
      if (!userId) {
        throw new Error("You need to be signed in to save sleep entries.");
      }

      return saveSleepRecoveryEntry(userId, value);
    },
    onMutate: async ({ value }) => {
      const queryKey = queryKeys.sleepLog(userId, value.logDate);

      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<SleepRecoveryEntry>(queryKey);
      queryClient.setQueryData(queryKey, value);

      return { previous, queryKey };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;

      if (context.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
        return;
      }

      queryClient.removeQueries({ queryKey: context.queryKey, exact: true });
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.sleepLog(userId, saved.logDate), saved);
    },
    onSettled: async (_saved, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.sleepLog(userId, variables.value.logDate),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sleepHistory(userId, 7),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardAggregate(userId, "sleep"),
        }),
      ]);
    },
  });
}

export function useRecentSleepHistoryQuery(limit = 7) {
  const { userId, authReady } = useAuth();

  return useQuery<SleepRecoveryEntry[]>({
    queryKey: queryKeys.sleepHistory(userId, limit),
    queryFn: async () => {
      if (!userId) return [];
      return loadRecentSleepRecoveryEntries(userId, limit);
    },
    enabled: authReady && Boolean(userId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
