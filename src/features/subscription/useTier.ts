import type { Tier } from "./useTierTypes";
import { useTierQuery, clearTierCache } from "./useTierQuery";
import {
  TIER_BADGE,
  TIER_COLORS,
  TIER_LABELS,
} from "./subscriptionConfig";

export type { Tier } from "./useTierTypes";

export const BETA_FREE_TIER_UNLOCKS_PRO = true;

export function effectiveTierForFeatureAccess(userTier: Tier): Tier {
  if (BETA_FREE_TIER_UNLOCKS_PRO && userTier === "free") {
    return "pro";
  }

  return userTier;
}

export function tierMeets(userTier: Tier, required: Tier): boolean {
  const rank: Record<Tier, number> = { free: 0, pro: 1, pro_max: 2 };
  return rank[effectiveTierForFeatureAccess(userTier)] >= rank[required];
}

export function useTier(): Tier {
  const { data } = useTierQuery();
  return data ?? "free";
}

export { clearTierCache };
export { TIER_LABELS, TIER_COLORS, TIER_BADGE };
