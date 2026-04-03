import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  createEmptyMentalWellbeingEntry,
  type MentalWellbeingEntry,
} from "./wellbeingTypes";
import {
  loadMentalWellbeingEntry,
  loadRecentMentalWellbeingEntries,
  saveMentalWellbeingEntry,
} from "./wellbeingStorage";

type SaveWellbeingEntryVariables = {
  value: MentalWellbeingEntry;
};

export function useMentalWellbeingEntryQuery(logDate: string) {
  const { userId, authReady } = useAuth();

  return useQuery<MentalWellbeingEntry>({
    queryKey: queryKeys.wellbeingLog(userId, logDate),
    queryFn: async () => {
      if (!userId) return createEmptyMentalWellbeingEntry("", logDate);
      return loadMentalWellbeingEntry(userId, logDate);
    },
    enabled: authReady && Boolean(userId) && Boolean(logDate),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useSaveMentalWellbeingEntryMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    MentalWellbeingEntry,
    Error,
    SaveWellbeingEntryVariables,
    { previous?: MentalWellbeingEntry; queryKey: ReturnType<typeof queryKeys.wellbeingLog> }
  >({
    mutationFn: async ({ value }) => {
      if (!userId) {
        throw new Error("You need to be signed in to save wellbeing check-ins.");
      }

      return saveMentalWellbeingEntry(userId, value);
    },
    onMutate: async ({ value }) => {
      const queryKey = queryKeys.wellbeingLog(userId, value.logDate);

      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<MentalWellbeingEntry>(queryKey);
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
      queryClient.setQueryData(
        queryKeys.wellbeingLog(userId, saved.logDate),
        saved,
      );
    },
    onSettled: async (_saved, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.wellbeingLog(userId, variables.value.logDate),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.wellbeingHistory(userId, 7),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardAggregate(userId, "wellbeing"),
        }),
      ]);
    },
  });
}

export function useRecentMentalWellbeingHistoryQuery(limit = 7) {
  const { userId, authReady } = useAuth();

  return useQuery<MentalWellbeingEntry[]>({
    queryKey: queryKeys.wellbeingHistory(userId, limit),
    queryFn: async () => {
      if (!userId) return [];
      return loadRecentMentalWellbeingEntries(userId, limit);
    },
    enabled: authReady && Boolean(userId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
