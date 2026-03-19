import { useEffect, useState } from "react";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import {
  getActiveUserId,
  getScopedStorageItem,
  removeScopedStorageItem,
  writeScopedStorageItem,
} from "@/lib/activeUser";
import { AUTH_USER_CHANGED_EVENT } from "@/lib/queryKeys";
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
export const AI_USAGE_EVENT = "ai-usage-updated";

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function coerceTier(value: unknown): Tier | null {
  if (value === "pro" || value === "pro_max" || value === "free") {
    return value;
  }

  return null;
}

function inferTierFromMonthlyLimit(monthlyLimit: number | null): Tier | null {
  if (monthlyLimit === null) return null;
  if (monthlyLimit >= 1000) return "pro_max";
  if (monthlyLimit >= 200) return "pro";
  if (monthlyLimit >= 1) return "free";
  return null;
}

function resolveTier(
  input: UsageLike,
  existingSnapshot: AIUsageSnapshot | null,
  fallbackTier?: Tier,
): Tier {
  return (
    coerceTier(input.tier) ??
    inferTierFromMonthlyLimit(
      typeof (input.monthlyLimit ?? input.monthly_limit) === "number" &&
        Number.isFinite(input.monthlyLimit ?? input.monthly_limit)
        ? Math.max(1, Number(input.monthlyLimit ?? input.monthly_limit))
        : null,
    ) ??
    existingSnapshot?.tier ??
    fallbackTier ??
    "free"
  );
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

  const userId = getActiveUserId();
  if (!userId) return null;

  try {
    const raw = getScopedStorageItem(STORAGE_KEY, userId);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AIUsageSnapshot>;
    const currentMonth = getMonthKey();

    if (parsed.monthKey !== currentMonth) {
      removeScopedStorageItem(STORAGE_KEY, userId);
      return null;
    }

    const parsedTier =
      coerceTier(parsed.tier) ??
      inferTierFromMonthlyLimit(
        typeof parsed.monthlyLimit === "number" && Number.isFinite(parsed.monthlyLimit)
          ? Math.max(1, parsed.monthlyLimit)
          : null,
      ) ??
      "free";

    const monthlyLimit =
      typeof parsed.monthlyLimit === "number" && Number.isFinite(parsed.monthlyLimit)
        ? Math.max(1, parsed.monthlyLimit)
        : defaultMonthlyLimitForTier(parsedTier);

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
      tier: parsedTier,
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

export function writeAIUsageCache(
  input: UsageLike,
  fallbackTier?: Tier,
): AIUsageSnapshot | null {
  const userId = getActiveUserId();
  if (!userId) return null;

  const existingSnapshot = readAIUsageCache();
  const tier = resolveTier(input, existingSnapshot, fallbackTier);

  const monthlyLimitRaw = input.monthlyLimit ?? input.monthly_limit;
  const promptsUsedRaw = input.promptsUsed ?? input.prompts_used;
  const remainingRaw = input.remaining;

  const monthlyLimit =
    typeof monthlyLimitRaw === "number" && Number.isFinite(monthlyLimitRaw)
      ? Math.max(1, monthlyLimitRaw)
      : existingSnapshot?.monthlyLimit ?? defaultMonthlyLimitForTier(tier);

  const promptsUsed =
    typeof promptsUsedRaw === "number" && Number.isFinite(promptsUsedRaw)
      ? Math.max(0, promptsUsedRaw)
      : typeof remainingRaw === "number" && Number.isFinite(remainingRaw)
        ? Math.max(0, monthlyLimit - remainingRaw)
        : existingSnapshot?.promptsUsed ?? 0;

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
    assertRegisteredCacheWrite(`${STORAGE_KEY}:${userId}`);
    writeScopedStorageItem(STORAGE_KEY, userId, JSON.stringify(snapshot));
  } catch {
    // ignore storage failures
  }

  emitUsageUpdated();
  return snapshot;
}

export function bumpAIUsageCache(fallbackTier?: Tier): AIUsageSnapshot | null {
  const existing = readAIUsageCache();
  const tier = existing?.tier ?? fallbackTier ?? "free";
  const monthlyLimit = existing?.monthlyLimit ?? defaultMonthlyLimitForTier(tier);
  const promptsUsed = Math.min(monthlyLimit, (existing?.promptsUsed ?? 0) + 1);
  const remaining = Math.max(0, monthlyLimit - promptsUsed);

  return writeAIUsageCache(
    {
      tier,
      monthlyLimit,
      promptsUsed,
      remaining,
    },
    tier,
  );
}

export function markAIUsageLimitReached(
  input: UsageLike,
  fallbackTier?: Tier,
): AIUsageSnapshot | null {
  const existingSnapshot = readAIUsageCache();
  const tier = resolveTier(input, existingSnapshot, fallbackTier);

  const monthlyLimitRaw = input.monthlyLimit ?? input.monthly_limit;
  const promptsUsedRaw = input.promptsUsed ?? input.prompts_used;

  const monthlyLimit =
    typeof monthlyLimitRaw === "number" && Number.isFinite(monthlyLimitRaw)
      ? Math.max(1, monthlyLimitRaw)
      : existingSnapshot?.monthlyLimit ?? defaultMonthlyLimitForTier(tier);

  const promptsUsed =
    typeof promptsUsedRaw === "number" && Number.isFinite(promptsUsedRaw)
      ? Math.max(0, promptsUsedRaw)
      : monthlyLimit;

  return writeAIUsageCache(
    {
      tier,
      monthlyLimit,
      promptsUsed,
      remaining: 0,
    },
    tier,
  );
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
    window.addEventListener(AUTH_USER_CHANGED_EVENT, refresh as EventListener);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(AI_USAGE_EVENT, refresh as EventListener);
      window.removeEventListener(
        AUTH_USER_CHANGED_EVENT,
        refresh as EventListener,
      );
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