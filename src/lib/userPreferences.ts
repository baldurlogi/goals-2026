export type MeasurementSystem = "metric" | "imperial";
export type DateFormatPreference = "dmy" | "mdy";
export type TimeFormatPreference = "24h" | "12h";

export type UserPreferences = {
  measurementSystem: MeasurementSystem;
  dateFormat: DateFormatPreference;
  timeFormat: TimeFormatPreference;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  measurementSystem: "metric",
  dateFormat: "dmy",
  timeFormat: "24h",
};

export function normalizeMeasurementSystem(
  value: unknown,
): MeasurementSystem {
  return value === "imperial" ? "imperial" : "metric";
}

export function normalizeDateFormatPreference(
  value: unknown,
): DateFormatPreference {
  return value === "mdy" ? "mdy" : "dmy";
}

export function normalizeTimeFormatPreference(
  value: unknown,
): TimeFormatPreference {
  return value === "12h" ? "12h" : "24h";
}

export function preferenceLocale(dateFormat: DateFormatPreference): string {
  return dateFormat === "mdy" ? "en-US" : "en-GB";
}

export function formatDateWithPreferences(
  date: Date,
  preferences: Pick<UserPreferences, "dateFormat">,
  options: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleDateString(
    preferenceLocale(preferences.dateFormat),
    options,
  );
}

export function formatTimeWithPreferences(
  date: Date,
  preferences: Pick<UserPreferences, "dateFormat" | "timeFormat">,
  options: Omit<Intl.DateTimeFormatOptions, "hour12"> = {
    hour: "numeric",
    minute: "2-digit",
  },
): string {
  return date.toLocaleTimeString(preferenceLocale(preferences.dateFormat), {
    ...options,
    hour12: preferences.timeFormat === "12h",
  });
}

export function formatTimeStringWithPreferences(
  time: string,
  preferences: Pick<UserPreferences, "dateFormat" | "timeFormat">,
): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return time;

  const date = new Date(2000, 0, 1, hours, minutes);
  return formatTimeWithPreferences(date, preferences);
}

export function kgToLbs(valueKg: number): number {
  return valueKg * 2.2046226218;
}

export function lbsToKg(valueLbs: number): number {
  return valueLbs / 2.2046226218;
}

export function cmToFeetInches(valueCm: number): { feet: number; inches: number } {
  const totalInches = valueCm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);

  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }

  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

export function metricWeightToDisplay(
  measurementSystem: MeasurementSystem,
  weightKg: string,
): string {
  if (!weightKg) return "";
  const parsed = Number(weightKg);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";

  if (measurementSystem === "imperial") {
    return String(Number(kgToLbs(parsed).toFixed(1)));
  }

  return weightKg;
}

export function metricHeightToDisplay(
  measurementSystem: MeasurementSystem,
  heightCm: string,
): { primary: string; secondary: string } {
  if (!heightCm) return { primary: "", secondary: "" };
  const parsed = Number(heightCm);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { primary: "", secondary: "" };
  }

  if (measurementSystem === "imperial") {
    const { feet, inches } = cmToFeetInches(parsed);
    return { primary: String(feet), secondary: String(inches) };
  }

  return { primary: heightCm, secondary: "" };
}
