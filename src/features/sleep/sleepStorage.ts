import { supabase } from "@/lib/supabaseClient";
import {
  createEmptySleepRecoveryEntry,
  mapSleepRecoveryEntryRow,
  type SleepRecoveryEntry,
  type SleepRecoveryEntryInsert,
  type SleepRecoveryEntryRow,
} from "./sleepTypes";

const SLEEP_ENTRY_SELECT =
  "user_id, log_date, sleep_duration_minutes, sleep_quality_score, bedtime, wake_time, energy_level, recovery_score, notes, source, sync_metadata, created_at, updated_at";

export async function loadSleepRecoveryEntry(
  userId: string,
  logDate: string,
): Promise<SleepRecoveryEntry> {
  const emptyEntry = createEmptySleepRecoveryEntry(userId, logDate);

  const { data, error } = await supabase
    .from("sleep_recovery_logs")
    .select(SLEEP_ENTRY_SELECT)
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .maybeSingle();

  if (error) {
    throw new Error("Couldn't load your sleep entry.");
  }

  if (!data) {
    return emptyEntry;
  }

  return mapSleepRecoveryEntryRow(data as SleepRecoveryEntryRow);
}

export async function saveSleepRecoveryEntry(
  userId: string,
  entry: SleepRecoveryEntry,
): Promise<SleepRecoveryEntry> {
  const payload: SleepRecoveryEntryInsert = {
    user_id: userId,
    log_date: entry.logDate,
    sleep_duration_minutes: normalizeNullableInteger(entry.sleepDurationMinutes),
    sleep_quality_score: normalizeNullableInteger(entry.sleepQualityScore),
    bedtime: normalizeNullableTime(entry.bedtime),
    wake_time: normalizeNullableTime(entry.wakeTime),
    energy_level: entry.energyLevel,
    recovery_score: normalizeNullableInteger(entry.recoveryScore),
    notes: normalizeNullableText(entry.notes),
    source: entry.source,
    sync_metadata: entry.syncMetadata,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("sleep_recovery_logs")
    .upsert(payload, { onConflict: "user_id,log_date" })
    .select(SLEEP_ENTRY_SELECT)
    .single();

  if (error) {
    throw new Error("Couldn't save your sleep entry.");
  }

  return mapSleepRecoveryEntryRow(data as SleepRecoveryEntryRow);
}

export async function loadLatestSleepRecoveryEntry(
  userId: string,
): Promise<SleepRecoveryEntry | null> {
  const { data, error } = await supabase
    .from("sleep_recovery_logs")
    .select(SLEEP_ENTRY_SELECT)
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Couldn't load your latest sleep summary.");
  }

  if (!data) return null;

  return mapSleepRecoveryEntryRow(data as SleepRecoveryEntryRow);
}

export async function loadRecentSleepRecoveryEntries(
  userId: string,
  limit = 7,
): Promise<SleepRecoveryEntry[]> {
  const { data, error } = await supabase
    .from("sleep_recovery_logs")
    .select(SLEEP_ENTRY_SELECT)
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Couldn't load your recent sleep history.");
  }

  return (data ?? []).map((row) =>
    mapSleepRecoveryEntryRow(row as SleepRecoveryEntryRow),
  );
}

export async function loadSleepRecoveryEntriesInRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<SleepRecoveryEntry[]> {
  const { data, error } = await supabase
    .from("sleep_recovery_logs")
    .select(SLEEP_ENTRY_SELECT)
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: true });

  if (error) {
    throw new Error("Couldn't load your sleep history.");
  }

  return (data ?? []).map((row) =>
    mapSleepRecoveryEntryRow(row as SleepRecoveryEntryRow),
  );
}

function normalizeNullableInteger(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function normalizeNullableTime(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeNullableText(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
