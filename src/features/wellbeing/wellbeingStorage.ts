import { supabase } from "@/lib/supabaseClient";
import {
  createEmptyMentalWellbeingEntry,
  mapMentalWellbeingEntryRow,
  type MentalWellbeingEntry,
  type MentalWellbeingEntryInsert,
  type MentalWellbeingEntryRow,
} from "./wellbeingTypes";

const WELLBEING_ENTRY_SELECT =
  "user_id, log_date, mood_score, stress_level, energy_level, journal_entry, gratitude_entry, created_at, updated_at";

export async function loadMentalWellbeingEntry(
  userId: string,
  logDate: string,
): Promise<MentalWellbeingEntry> {
  const emptyEntry = createEmptyMentalWellbeingEntry(userId, logDate);

  const { data, error } = await supabase
    .from("mental_wellbeing_logs")
    .select(WELLBEING_ENTRY_SELECT)
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .maybeSingle();

  if (error) {
    throw new Error("Couldn't load your wellbeing check-in.");
  }

  if (!data) {
    return emptyEntry;
  }

  return mapMentalWellbeingEntryRow(data as MentalWellbeingEntryRow);
}

export async function saveMentalWellbeingEntry(
  userId: string,
  entry: MentalWellbeingEntry,
): Promise<MentalWellbeingEntry> {
  if (entry.moodScore === null) {
    throw new Error("Mood is required to save your check-in.");
  }

  const payload: MentalWellbeingEntryInsert = {
    user_id: userId,
    log_date: entry.logDate,
    mood_score: entry.moodScore,
    stress_level: entry.stressLevel,
    energy_level: entry.energyLevel,
    journal_entry: normalizeNullableText(entry.journalEntry),
    gratitude_entry: normalizeNullableText(entry.gratitudeEntry),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("mental_wellbeing_logs")
    .upsert(payload, { onConflict: "user_id,log_date" })
    .select(WELLBEING_ENTRY_SELECT)
    .single();

  if (error) {
    throw new Error("Couldn't save your wellbeing check-in.");
  }

  return mapMentalWellbeingEntryRow(data as MentalWellbeingEntryRow);
}

export async function loadLatestMentalWellbeingEntry(
  userId: string,
): Promise<MentalWellbeingEntry | null> {
  const { data, error } = await supabase
    .from("mental_wellbeing_logs")
    .select(WELLBEING_ENTRY_SELECT)
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Couldn't load your latest wellbeing check-in.");
  }

  if (!data) return null;

  return mapMentalWellbeingEntryRow(data as MentalWellbeingEntryRow);
}

export async function loadRecentMentalWellbeingEntries(
  userId: string,
  limit = 7,
): Promise<MentalWellbeingEntry[]> {
  const { data, error } = await supabase
    .from("mental_wellbeing_logs")
    .select(WELLBEING_ENTRY_SELECT)
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Couldn't load your recent wellbeing history.");
  }

  return (data ?? []).map((row) =>
    mapMentalWellbeingEntryRow(row as MentalWellbeingEntryRow),
  );
}

export async function loadMentalWellbeingEntriesInRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<MentalWellbeingEntry[]> {
  const { data, error } = await supabase
    .from("mental_wellbeing_logs")
    .select(WELLBEING_ENTRY_SELECT)
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: true });

  if (error) {
    throw new Error("Couldn't load your recent wellbeing history.");
  }

  return (data ?? []).map((row) =>
    mapMentalWellbeingEntryRow(row as MentalWellbeingEntryRow),
  );
}

function normalizeNullableText(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
