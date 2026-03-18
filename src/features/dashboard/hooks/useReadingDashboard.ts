import { useMemo } from "react";
import { DEFAULT_READING_INPUTS } from "@/features/reading/readingStorage";
import { useReadingQuery } from "@/features/reading/useReadingQuery";
import { inputsToPlan, getReadingStats } from "@/features/reading/readingUtils";

export function useReadingDashboard() {
  const { data: inputs = DEFAULT_READING_INPUTS, isLoading: loading } = useReadingQuery();

  const stats = useMemo(
    () => getReadingStats(inputsToPlan(inputs)),
    [inputs],
  );

  const hasReading = Boolean(
    stats.current.title.trim()      ||
    stats.current.author.trim()     ||
    inputs.current.totalPages.trim() ||
    inputs.current.currentPage.trim(),
  );

  return { stats, hasReading, loading };
}