import { useEffect, useMemo, useState } from "react";
import {
  loadReadingInputs,
  READING_CHANGED_EVENT,
} from "@/features/reading/readingStorage";
import { inputsToPlan, getReadingStats } from "@/features/reading/readingUtils";
import type { ReadingInputs } from "@/features/reading/readingTypes";
import { DEFAULT_READING_INPUTS } from "@/features/reading/readingStorage";

export function useReadingDashboard() {
  const [readingInputs, setReadingInputs] = useState<ReadingInputs>(DEFAULT_READING_INPUTS);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const next = await loadReadingInputs();
      if (!cancelled) setReadingInputs(next);
    };

    // initial load
    sync();

    // on app-level event (emitted after save)
    window.addEventListener(READING_CHANGED_EVENT, sync);

    return () => {
      cancelled = true;
      window.removeEventListener(READING_CHANGED_EVENT, sync);
    };
  }, []);

  const stats = useMemo(
    () => getReadingStats(inputsToPlan(readingInputs)),
    [readingInputs]
  );

  const hasReading = Boolean(
    stats.current.title.trim() ||
      stats.current.author.trim() ||
      readingInputs.current.totalPages.trim() ||
      readingInputs.current.currentPage.trim()
  );

  return { stats, hasReading };
}