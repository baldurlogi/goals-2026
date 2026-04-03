export type SleepEnergyLevel = 1 | 2 | 3 | 4 | 5;
export type SleepEntrySource =
  | "manual"
  | "apple_health"
  | "health_connect"
  | "wearable_api";

export type SleepSyncMetadata = {
  provider: Exclude<SleepEntrySource, "manual">;
  externalId: string | null;
  lastSyncedAt: string;
  externalUpdatedAt: string | null;
};

export type SleepRecoveryEntry = {
  userId: string;
  logDate: string;
  sleepDurationMinutes: number | null;
  sleepQualityScore: number | null;
  bedtime: string | null;
  wakeTime: string | null;
  energyLevel: SleepEnergyLevel | null;
  recoveryScore: number | null;
  notes: string | null;
  source: SleepEntrySource;
  syncMetadata: SleepSyncMetadata | null;
  createdAt: string;
  updatedAt: string;
};

export type SleepRecoveryEntryRow = {
  user_id: string;
  log_date: string;
  sleep_duration_minutes: number | null;
  sleep_quality_score: number | null;
  bedtime: string | null;
  wake_time: string | null;
  energy_level: SleepEnergyLevel | null;
  recovery_score: number | null;
  notes: string | null;
  source: SleepEntrySource;
  sync_metadata: SleepSyncMetadata | null;
  created_at: string;
  updated_at: string;
};

export type SleepRecoveryEntryInsert = {
  user_id: string;
  log_date: string;
  sleep_duration_minutes?: number | null;
  sleep_quality_score?: number | null;
  bedtime?: string | null;
  wake_time?: string | null;
  energy_level?: SleepEnergyLevel | null;
  recovery_score?: number | null;
  notes?: string | null;
  source?: SleepEntrySource;
  sync_metadata?: SleepSyncMetadata | null;
  created_at?: string;
  updated_at?: string;
};

export type SleepRecoveryEntryUpdate = Partial<
  Pick<
    SleepRecoveryEntryInsert,
    | "sleep_duration_minutes"
    | "sleep_quality_score"
    | "bedtime"
    | "wake_time"
    | "energy_level"
    | "recovery_score"
    | "notes"
    | "source"
    | "sync_metadata"
    | "updated_at"
  >
>;

export function mapSleepRecoveryEntryRow(
  row: SleepRecoveryEntryRow,
): SleepRecoveryEntry {
  return {
    userId: row.user_id,
    logDate: row.log_date,
    sleepDurationMinutes: row.sleep_duration_minutes,
    sleepQualityScore: row.sleep_quality_score,
    bedtime: normalizeSleepTime(row.bedtime),
    wakeTime: normalizeSleepTime(row.wake_time),
    energyLevel: row.energy_level,
    recoveryScore: row.recovery_score,
    notes: row.notes,
    source: row.source,
    syncMetadata: row.sync_metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createEmptySleepRecoveryEntry(
  userId: string,
  logDate: string,
): SleepRecoveryEntry {
  const now = new Date().toISOString();

  return {
    userId,
    logDate,
    sleepDurationMinutes: null,
    sleepQualityScore: null,
    bedtime: null,
    wakeTime: null,
    energyLevel: null,
    recoveryScore: null,
    notes: null,
    source: "manual",
    syncMetadata: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function hasSleepRecoveryContent(entry: SleepRecoveryEntry): boolean {
  return (
    entry.sleepDurationMinutes !== null ||
    entry.sleepQualityScore !== null ||
    entry.bedtime !== null ||
    entry.wakeTime !== null ||
    entry.energyLevel !== null ||
    entry.recoveryScore !== null ||
    (entry.notes?.trim() ?? "") !== ""
  );
}

function normalizeSleepTime(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  return /^\d{2}:\d{2}/.test(trimmed) ? trimmed.slice(0, 5) : trimmed;
}
