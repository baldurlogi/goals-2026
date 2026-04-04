import type { Tier } from "./useTierTypes";
import { useTierQuery, clearTierCache } from "./useTierQuery";

export type { Tier } from "./useTierTypes";

export const TIER_LABELS: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  pro_max: "Pro Max",
};

export const TIER_COLORS: Record<Tier, string> = {
  free: "text-muted-foreground",
  pro: "text-violet-400",
  pro_max: "text-amber-400",
};

export const TIER_BADGE: Record<Tier, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
  pro_max: "bg-amber-400/15 text-amber-400 border border-amber-400/30",
};

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
