import {
  createEmptySleepRecoveryEntry,
  type SleepRecoveryEntry,
  type SleepEntrySource,
  type SleepSyncMetadata,
} from "./sleepTypes";

export type SleepSyncProviderId = Exclude<SleepEntrySource, "manual">;

export type SleepSyncWindow = {
  startDate: string;
  endDate: string;
};

export type SyncedSleepEntry = {
  source: SleepSyncProviderId;
  logDate: string;
  sleepDurationMinutes: number | null;
  sleepQualityScore: number | null;
  bedtime: string | null;
  wakeTime: string | null;
  externalId: string | null;
  externalUpdatedAt: string | null;
  syncedAt: string;
};

export type SleepSyncProvider = {
  id: SleepSyncProviderId;
  label: string;
  isAvailable(): Promise<boolean>;
  requestAccess(): Promise<"granted" | "denied" | "unavailable">;
  pullDailyEntries(window: SleepSyncWindow): Promise<SyncedSleepEntry[]>;
};

type SyncControlledField =
  | "sleepDurationMinutes"
  | "sleepQualityScore"
  | "bedtime"
  | "wakeTime";

const SYNC_CONTROLLED_FIELDS: SyncControlledField[] = [
  "sleepDurationMinutes",
  "sleepQualityScore",
  "bedtime",
  "wakeTime",
];

function buildSyncMetadata(entry: SyncedSleepEntry): SleepSyncMetadata {
  return {
    provider: entry.source,
    externalId: entry.externalId,
    lastSyncedAt: entry.syncedAt,
    externalUpdatedAt: entry.externalUpdatedAt,
  };
}

function isManualOwnedField(
  existing: SleepRecoveryEntry | null,
  field: SyncControlledField,
): boolean {
  if (!existing) return false;
  if (existing.source !== "manual") return false;
  return existing[field] !== null;
}

export function mergeSyncedSleepEntry(
  userId: string,
  existing: SleepRecoveryEntry | null,
  incoming: SyncedSleepEntry,
): SleepRecoveryEntry {
  const base =
    existing ?? createEmptySleepRecoveryEntry(userId, incoming.logDate);

  const next: SleepRecoveryEntry = {
    ...base,
    logDate: incoming.logDate,
    source: base.source === "manual" ? base.source : incoming.source,
    syncMetadata: buildSyncMetadata(incoming),
  };

  for (const field of SYNC_CONTROLLED_FIELDS) {
    if (isManualOwnedField(existing, field)) continue;

    switch (field) {
      case "sleepDurationMinutes":
        if (incoming.sleepDurationMinutes !== null) {
          next.sleepDurationMinutes = incoming.sleepDurationMinutes;
        }
        break;
      case "sleepQualityScore":
        if (incoming.sleepQualityScore !== null) {
          next.sleepQualityScore = incoming.sleepQualityScore;
        }
        break;
      case "bedtime":
        if (incoming.bedtime !== null) {
          next.bedtime = incoming.bedtime;
        }
        break;
      case "wakeTime":
        if (incoming.wakeTime !== null) {
          next.wakeTime = incoming.wakeTime;
        }
        break;
    }
  }

  return next;
}
