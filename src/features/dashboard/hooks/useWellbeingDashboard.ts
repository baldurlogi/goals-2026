import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { loadLatestMentalWellbeingEntry } from "@/features/wellbeing/wellbeingStorage";
import { type MentalWellbeingEntry } from "@/features/wellbeing/wellbeingTypes";
import { useTodayDate } from "@/hooks/useTodayDate";
import { queryKeys } from "@/lib/queryKeys";

export function useWellbeingDashboard() {
  const { userId, authReady } = useAuth();
  const today = useTodayDate();

  const query = useQuery<MentalWellbeingEntry | null>({
    queryKey: queryKeys.dashboardAggregate(userId, "wellbeing"),
    queryFn: async () => {
      if (!userId) return null;
      return loadLatestMentalWellbeingEntry(userId);
    },
    enabled: authReady && Boolean(userId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const summary = useMemo(() => {
    const latest = query.data;
    const hasEntry = Boolean(latest);
    const checkedInToday = latest?.logDate === today;

    return {
      latest,
      hasEntry,
      checkedInToday,
      loading: query.isLoading,
    };
  }, [query.data, query.isLoading, today]);

  return summary;
}
