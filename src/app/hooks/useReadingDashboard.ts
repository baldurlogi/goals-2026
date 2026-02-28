import { useEffect, useMemo, useState } from "react";
import {
  loadReadingInputs,
  DEFAULT_READING_INPUTS,
  READING_CHANGED_EVENT,
} from "@/features/reading/readingStorage";
import { inputsToPlan, getReadingStats } from "@/features/reading/readingUtils";
import type { ReadingInputs } from "@/features/reading/readingTypes";

const CACHE_KEY = "daily-life:reading:v2";

/** Read cached value from localStorage synchronously — instant on first paint */
function readCache(): ReadingInputs {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_READING_INPUTS;
  } catch {
    return DEFAULT_READING_INPUTS;
  }
}

export function useReadingDashboard() {
  // Seed state from localStorage cache — renders immediately with real data
  const [inputs,  setInputs]  = useState<ReadingInputs>(readCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchFromSupabase() {
      const fresh = await loadReadingInputs();
      if (!cancelled) {
        setInputs(fresh);
        setLoading(false);
        // Keep cache in sync for next load
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch {}
      }
    }

    fetchFromSupabase();

    // Re-fetch when another tab/component saves
    const sync = () => { fetchFromSupabase(); };
    window.addEventListener(READING_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      cancelled = true;
      window.removeEventListener(READING_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

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