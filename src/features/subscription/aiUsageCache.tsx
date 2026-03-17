import { useEffect, useState } from "react";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import { getActiveUserId, scopedKey } from "@/lib/activeUser";
import type { Tier } from "./useTier";

export type AIUsageSnapshot = {
  monthKey: string;
  tier: Tier;
  monthlyLimit: number;
  promptsUsed: number;
  remaining: number;
  updatedAt: number;
};

type UsageLike = {
  tier?: unknown;
  monthly_limit?: number;
  monthlyLimit?: number;
  prompts_used?: number;
  promptsUsed?: number;
  remaining?: number;
};

const STORAGE_KEY = CACHE_KEYS.AI_USAGE;

function getStorageKey() {
  return scopedKey(STORAGE_KEY, getActiveUserId());
}
export const AI_USAGE_EVENT = "ai-usage-updated";

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function coerceTier(value: unknown): Tier {
  return value === "pro" || value === "pro_max" ? value : "free";
}

export function defaultMonthlyLimitForTier(tier: Tier): number {
  if (tier === "pro") return 200;
  if (tier === "pro_max") return 1000;
  return 10;
}

function emitUsageUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AI_USAGE_EVENT));
  }
}

export function readAIUsageCache(): AIUsageSnapshot | null {
  if (typeof window === "undefined") return null;

  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AIUsageSnapshot>;
    const currentMonth = getMonthKey();

    if (parsed.monthKey !== currentMonth) {
      localStorage.removeItem(key);
      return null;
    }

    const tier = coerceTier(parsed.tier);
    const monthlyLimit =
      typeof parsed.monthlyLimit === "number" && Number.isFinite(parsed.monthlyLimit)
        ? Math.max(1, parsed.monthlyLimit)
        : defaultMonthlyLimitForTier(tier);

    const promptsUsed =
      typeof parsed.promptsUsed === "number" && Number.isFinite(parsed.promptsUsed)
        ? Math.max(0, parsed.promptsUsed)
        : 0;

    const remaining =
      typeof parsed.remaining === "number" && Number.isFinite(parsed.remaining)
        ? Math.max(0, parsed.remaining)
        : Math.max(0, monthlyLimit - promptsUsed);

    return {
      monthKey: currentMonth,
      tier,
      monthlyLimit,
      promptsUsed,
      remaining,
      updatedAt:
        typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeAIUsageCache(input: UsageLike): AIUsageSnapshot {
  const tier = coerceTier(input.tier);
  const monthlyLimitRaw = input.monthlyLimit ?? input.monthly_limit;
  const promptsUsedRaw = input.promptsUsed ?? input.prompts_used;
  const remainingRaw = input.remaining;

  const monthlyLimit =
    typeof monthlyLimitRaw === "number" && Number.isFinite(monthlyLimitRaw)
      ? Math.max(1, monthlyLimitRaw)
      : defaultMonthlyLimitForTier(tier);

  const promptsUsed =
    typeof promptsUsedRaw === "number" && Number.isFinite(promptsUsedRaw)
      ? Math.max(0, promptsUsedRaw)
      : typeof remainingRaw === "number" && Number.isFinite(remainingRaw)
      ? Math.max(0, monthlyLimit - remainingRaw)
      : 0;

  const remaining =
    typeof remainingRaw === "number" && Number.isFinite(remainingRaw)
      ? Math.max(0, remainingRaw)
      : Math.max(0, monthlyLimit - promptsUsed);

  const snapshot: AIUsageSnapshot = {
    monthKey: getMonthKey(),
    tier,
    monthlyLimit,
    promptsUsed,
    remaining,
    updatedAt: Date.now(),
  };

  try {
    const key = getStorageKey();
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // ignore storage failures
  }

  emitUsageUpdated();
  return snapshot;
}

export function markAIUsageLimitReached(input: UsageLike): AIUsageSnapshot {
  const tier = coerceTier(input.tier);
  const monthlyLimitRaw = input.monthlyLimit ?? input.monthly_limit;
  const promptsUsedRaw = input.promptsUsed ?? input.prompts_used;

  const monthlyLimit =
    typeof monthlyLimitRaw === "number" && Number.isFinite(monthlyLimitRaw)
      ? Math.max(1, monthlyLimitRaw)
      : defaultMonthlyLimitForTier(tier);

  const promptsUsed =
    typeof promptsUsedRaw === "number" && Number.isFinite(promptsUsedRaw)
      ? Math.max(0, promptsUsedRaw)
      : monthlyLimit;

  return writeAIUsageCache({
    tier,
    monthlyLimit,
    promptsUsed,
    remaining: 0,
  });
}

export function useAIUsageSnapshot(expectedTier?: Tier) {
  const [snapshot, setSnapshot] = useState<AIUsageSnapshot | null>(() =>
    readAIUsageCache(),
  );

  useEffect(() => {
    const refresh = () => setSnapshot(readAIUsageCache());

    refresh();
    if (typeof window === "undefined") return;

    window.addEventListener("storage", refresh);
    window.addEventListener(AI_USAGE_EVENT, refresh as EventListener);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(AI_USAGE_EVENT, refresh as EventListener);
    };
  }, []);

  if (expectedTier && snapshot?.tier !== expectedTier) {
    return null;
  }

  return snapshot;
}

export function getAIUsageResetLabel() {
  return "Resets on the 1st of each month";
}
