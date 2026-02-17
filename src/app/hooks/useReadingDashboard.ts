import { useEffect, useMemo, useState } from "react";
import {
  loadReadingInputs,
  READING_CHANGED_EVENT,
} from "@/features/reading/readingStorage";
import { inputsToPlan, getReadingStats } from "@/features/reading/readingUtils";

export function useReadingDashboard() {
  const [readingInputs, setReadingInputs] = useState(() => loadReadingInputs());

  useEffect(() => {
    const sync = () => setReadingInputs(loadReadingInputs());
    window.addEventListener(READING_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(READING_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const stats = useMemo(
    () => getReadingStats(inputsToPlan(readingInputs)),
    [readingInputs],
  );

  const hasReading = Boolean(
    stats.current.title.trim() ||
    stats.current.author.trim() ||
    readingInputs.current.totalPages.trim() ||
    readingInputs.current.currentPage.trim(),
  );

  return { stats, hasReading };
}