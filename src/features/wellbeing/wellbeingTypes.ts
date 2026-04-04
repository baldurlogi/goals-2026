export type WellbeingScaleValue = 1 | 2 | 3 | 4 | 5;

export type MentalWellbeingEntry = {
  userId: string;
  logDate: string;
  moodScore: WellbeingScaleValue | null;
  stressLevel: WellbeingScaleValue | null;
  energyLevel: WellbeingScaleValue | null;
  journalEntry: string | null;
  gratitudeEntry: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MentalWellbeingEntryRow = {
  user_id: string;
  log_date: string;
  mood_score: WellbeingScaleValue;
  stress_level: WellbeingScaleValue | null;
  energy_level: WellbeingScaleValue | null;
  journal_entry: string | null;
  gratitude_entry: string | null;
  created_at: string;
  updated_at: string;
};

export type MentalWellbeingEntryInsert = {
  user_id: string;
  log_date: string;
  mood_score: WellbeingScaleValue;
  stress_level?: WellbeingScaleValue | null;
  energy_level?: WellbeingScaleValue | null;
  journal_entry?: string | null;
  gratitude_entry?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MentalWellbeingEntryUpdate = Partial<
  Pick<
    MentalWellbeingEntryInsert,
    | "mood_score"
    | "stress_level"
    | "energy_level"
    | "journal_entry"
    | "gratitude_entry"
    | "updated_at"
  >
>;

export function mapMentalWellbeingEntryRow(
  row: MentalWellbeingEntryRow,
): MentalWellbeingEntry {
  return {
    userId: row.user_id,
    logDate: row.log_date,
    moodScore: row.mood_score,
    stressLevel: row.stress_level,
    energyLevel: row.energy_level,
    journalEntry: row.journal_entry,
    gratitudeEntry: row.gratitude_entry,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createEmptyMentalWellbeingEntry(
  userId: string,
  logDate: string,
): MentalWellbeingEntry {
  const now = new Date().toISOString();

  return {
    userId,
    logDate,
    moodScore: null,
    stressLevel: null,
    energyLevel: null,
    journalEntry: null,
    gratitudeEntry: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function hasMentalWellbeingContent(
  entry: MentalWellbeingEntry,
): boolean {
  return (
    entry.moodScore !== null ||
    entry.stressLevel !== null ||
    entry.energyLevel !== null ||
    (entry.journalEntry?.trim() ?? "") !== "" ||
    (entry.gratitudeEntry?.trim() ?? "") !== ""
  );
}
