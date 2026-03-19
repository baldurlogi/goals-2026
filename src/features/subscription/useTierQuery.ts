import { useMemo } from "react";
import { useProfileQuery } from "@/features/onboarding/useProfileQuery";
import type { Tier } from "./useTier";

export function useTierQuery() {
  const profileQuery = useProfileQuery();

  const tier = useMemo<Tier>(() => {
    const currentTier = profileQuery.data?.tier;
    return currentTier === "pro" || currentTier === "pro_max" ? currentTier : "free";
  }, [profileQuery.data?.tier]);

  return {
    ...profileQuery,
    data: tier,
  };
}

export function clearTierCache() {
  // Tier now derives from the current profile query.
}
