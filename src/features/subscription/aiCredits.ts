import type { Tier } from "./useTierTypes";

export const BETA_MONTHLY_AI_CREDITS = 1000;

export const AI_ACTION_CREDIT_COSTS = {
  goalGeneration: 3,
  goalImprove: 2,
  weeklyReport: 4,
  coachSuggestion: 1,
  fitnessWeeklyPlan: 4,
} as const;

export type AIUsage = {
  credits_used: number;
  monthly_limit: number;
  remaining: number;
  tier: Tier | string;
  credits_cost?: number;
};

export type AILimitPayload = {
  error?: "monthly_limit_reached";
  message?: string;
  tier?: Tier | string;
  monthly_limit?: number;
  credits_used?: number;
  prompts_used?: number;
  credits_cost?: number;
  upgrade_required?: boolean;
};

export function formatCreditCost(cost: number): string {
  return `${cost} credit${cost === 1 ? "" : "s"}`;
}

export function coerceAIUsage(
  value: unknown,
  fallback: Partial<AIUsage> = {},
): AIUsage {
  const fallbackTier =
    typeof fallback.tier === "string" && fallback.tier.trim()
      ? fallback.tier
      : "free";
  const fallbackLimit =
    typeof fallback.monthly_limit === "number" && Number.isFinite(fallback.monthly_limit)
      ? Math.max(1, Math.round(fallback.monthly_limit))
      : BETA_MONTHLY_AI_CREDITS;
  const fallbackUsed =
    typeof fallback.credits_used === "number" && Number.isFinite(fallback.credits_used)
      ? Math.max(0, Math.round(fallback.credits_used))
      : 0;
  const fallbackRemaining =
    typeof fallback.remaining === "number" && Number.isFinite(fallback.remaining)
      ? Math.max(0, Math.round(fallback.remaining))
      : Math.max(0, fallbackLimit - fallbackUsed);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      credits_used: fallbackUsed,
      monthly_limit: fallbackLimit,
      remaining: fallbackRemaining,
      tier: fallbackTier,
      credits_cost: fallback.credits_cost,
    };
  }

  const record = value as Record<string, unknown>;
  const monthlyLimit =
    typeof record.monthly_limit === "number" && Number.isFinite(record.monthly_limit)
      ? Math.max(1, Math.round(record.monthly_limit))
      : fallbackLimit;
  const creditsUsedRaw =
    typeof record.credits_used === "number" && Number.isFinite(record.credits_used)
      ? record.credits_used
      : typeof record.prompts_used === "number" && Number.isFinite(record.prompts_used)
        ? record.prompts_used
        : fallbackUsed;
  const creditsUsed = Math.max(0, Math.round(creditsUsedRaw));
  const remaining =
    typeof record.remaining === "number" && Number.isFinite(record.remaining)
      ? Math.max(0, Math.round(record.remaining))
      : Math.max(0, monthlyLimit - creditsUsed);
  const creditsCost =
    typeof record.credits_cost === "number" && Number.isFinite(record.credits_cost)
      ? Math.max(0, Math.round(record.credits_cost))
      : typeof fallback.credits_cost === "number" && Number.isFinite(fallback.credits_cost)
        ? Math.max(0, Math.round(fallback.credits_cost))
        : undefined;

  return {
    credits_used: creditsUsed,
    monthly_limit: monthlyLimit,
    remaining,
    tier:
      typeof record.tier === "string" && record.tier.trim()
        ? record.tier
        : fallbackTier,
    credits_cost: creditsCost,
  };
}
