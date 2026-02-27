// src/features/reading/readingStorage.ts
import type { ReadingInputs } from "./readingTypes";
import { supabase } from "@/lib/supabaseClient";

// Local key only used for optional legacy fallback + migration safety
const STORAGE_KEY = "daily-life:reading:v2";

export const READING_CHANGED_EVENT = "daily-life:reading:changed";
function emitReadingChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(READING_CHANGED_EVENT));
  }
}

export const DEFAULT_READING_INPUTS: ReadingInputs = {
  current: { title: "", author: "", currentPage: "", totalPages: "" },
  upNext: [],
  completed: [],
  dailyGoalPages: "20",
};

// helper: merge partial into defaults safely
function normalizeReadingInputs(parsed: Partial<ReadingInputs> | null | undefined): ReadingInputs {
  const p = parsed ?? {};
  return {
    ...DEFAULT_READING_INPUTS,
    ...p,
    current: { ...DEFAULT_READING_INPUTS.current, ...(p.current ?? {}) },
    upNext: Array.isArray(p.upNext) ? p.upNext : [],
    completed: Array.isArray(p.completed) ? p.completed : [],
    dailyGoalPages:
      typeof (p as any).dailyGoalPages === "string"
        ? (p as any).dailyGoalPages
        : DEFAULT_READING_INPUTS.dailyGoalPages,
  };
}

/**
 * Load reading from Supabase (reading_state).
 * Falls back to localStorage if:
 *  - not logged in
 *  - Supabase errors
 *  - no row exists yet
 */
export async function loadReadingInputs(): Promise<ReadingInputs> {
  try {
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    const user = auth?.user;

    // If not logged in, fall back to local (so UI still works on auth screens/dev)
    if (!user) {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeReadingInputs(JSON.parse(raw)) : DEFAULT_READING_INPUTS;
    }

    const { data, error } = await supabase
      .from("reading_state")
      .select("state")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    // If no row yet, fallback to localStorage (useful before migration)
    const state = (data?.state ?? null) as Partial<ReadingInputs> | null;
    if (!state) {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeReadingInputs(JSON.parse(raw)) : DEFAULT_READING_INPUTS;
    }

    return normalizeReadingInputs(state);
  } catch (e) {
    console.warn("loadReadingInputs failed, falling back to defaults/local:", e);
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeReadingInputs(JSON.parse(raw)) : DEFAULT_READING_INPUTS;
  }
}

/**
 * Save reading to Supabase (reading_state).
 * Also mirrors to localStorage for offline-ish resilience.
 */
export async function saveReadingInputs(value: ReadingInputs): Promise<void> {
  // Mirror locally (optional but nice)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  // If not logged in, just keep local
  if (!user) {
    emitReadingChanged();
    return;
  }

  const { error } = await supabase
    .from("reading_state")
    .upsert(
      {
        user_id: user.id,
        state: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;

  emitReadingChanged();
}

export async function resetReadingInputs(): Promise<ReadingInputs> {
  await saveReadingInputs(DEFAULT_READING_INPUTS);
  return DEFAULT_READING_INPUTS;
}