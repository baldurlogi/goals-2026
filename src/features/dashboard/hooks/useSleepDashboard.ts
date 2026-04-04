import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { loadLatestSleepRecoveryEntry } from "@/features/sleep/sleepStorage";
import { type SleepRecoveryEntry } from "@/features/sleep/sleepTypes";
import { useTodayDate } from "@/hooks/useTodayDate";
import { queryKeys } from "@/lib/queryKeys";

export function useSleepDashboard() {
  const { userId, authReady } = useAuth();
  const today = useTodayDate();

  const query = useQuery<SleepRecoveryEntry | null>({
    queryKey: queryKeys.dashboardAggregate(userId, "sleep"),
    queryFn: async () => {
      if (!userId) return null;
      return loadLatestSleepRecoveryEntry(userId);
    },
    enabled: authReady && Boolean(userId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const summary = useMemo(() => {
    const latest = query.data;
    const hasEntry = Boolean(latest);
    const loggedToday = latest?.logDate === today;

    return {
      latest,
      hasEntry,
      loggedToday,
      loading: query.isLoading,
    };
  }, [query.data, query.isLoading, today]);

  return summary;
}
