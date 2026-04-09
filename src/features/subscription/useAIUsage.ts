import { useTier } from "@/features/subscription/useTier";
import {
  defaultMonthlyLimitForTier,
  useAIUsageSnapshot,
} from "@/features/subscription/aiUsageCache";

export type AIUsageState = {
  used: number;
  limit: number;
  remaining: number;
  pct: number;
  tier: ReturnType<typeof useTier>;
  loading: boolean;
};

/**
 * Lightweight hook that reads AI usage from the local cache.
 * Used by AICoachCard's inline UsagePill.
 * Cache is populated whenever an AI action completes (writeAIUsageCache).
 */
export function useAIUsage(): AIUsageState {
  const tier = useTier();
  const snapshot = useAIUsageSnapshot();

  const limit = snapshot?.monthlyLimit ?? defaultMonthlyLimitForTier(tier);
  const used = snapshot?.creditsUsed ?? 0;
  const remaining = snapshot?.remaining ?? limit;
  const pct = Math.min(100, Math.round((used / limit) * 100));

  // loading=true only when we genuinely have no data yet
  const loading = !snapshot && used === 0;

  return { used, limit, remaining, pct, tier, loading };
}
