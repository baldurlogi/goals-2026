import { useMemo } from "react";
import { useProfileQuery } from "@/features/onboarding/useProfileQuery";

export function useProfile() {
  const query = useProfileQuery();
  return useMemo(() => query.data ?? null, [query.data]);
}
