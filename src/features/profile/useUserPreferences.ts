import { useMemo } from "react";
import { useProfileQuery } from "@/features/onboarding/useProfileQuery";
import {
  DEFAULT_USER_PREFERENCES,
  normalizeDateFormatPreference,
  normalizeMeasurementSystem,
  normalizeTimeFormatPreference,
} from "@/lib/userPreferences";

export function useUserPreferences() {
  const { data: profile } = useProfileQuery();

  return useMemo(
    () => ({
      measurementSystem: normalizeMeasurementSystem(
        profile?.measurement_system ?? DEFAULT_USER_PREFERENCES.measurementSystem,
      ),
      dateFormat: normalizeDateFormatPreference(
        profile?.date_format ?? DEFAULT_USER_PREFERENCES.dateFormat,
      ),
      timeFormat: normalizeTimeFormatPreference(
        profile?.time_format ?? DEFAULT_USER_PREFERENCES.timeFormat,
      ),
    }),
    [profile?.date_format, profile?.measurement_system, profile?.time_format],
  );
}
