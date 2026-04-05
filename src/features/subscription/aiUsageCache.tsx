import { useEffect, useState } from "react";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import {
  getActiveUserId,
  getScopedStorageItem,
  removeScopedStorageItem,
  writeScopedStorageItem,
} from "@/lib/activeUser";
import { AUTH_USER_CHANGED_EVENT } from "@/lib/queryKeys";
import {
  effectiveTierForFeatureAccess,
  type Tier,
} from "./useTier";
import { getSupabaseFunctionUrl, supabase } from "@/lib/supabaseClient";

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

function isUsageLike(value: unknown): value is UsageLike {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const record = value as Record<string, unknown>;

  return (
    "tier" in record ||
    "monthly_limit" in record ||
    "monthlyLimit" in record ||
    "prompts_used" in record ||
    "promptsUsed" in record ||
    "remaining" in record
  );
}

const STORAGE_KEY = CACHE_KEYS.AI_USAGE;
export const AI_USAGE_EVENT = "ai-usage-updated";
const AI_USAGE_HYDRATE_STALE_MS = 5 * 60 * 1000;
const HYPER_RESPONDER_URL = getSupabaseFunctionUrl("hyper-responder");

let inFlightUsageHydration: Promise<AIUsageSnapshot | null> | null = null;

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
  const effectiveTier = effectiveTierForFeatureAccess(tier);

  if (effectiveTier === "pro") return 200;
  if (effectiveTier === "pro_max") return 1000;
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

async function fetchAIUsageSnapshot(
  fallbackTier?: Tier,
): Promise<AIUsageSnapshot | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return null;

  const response = await fetch(HYPER_RESPONDER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action: "usage" }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { usage?: unknown } | unknown;
  const usage =
    data && typeof data === "object" && "usage" in data
      ? (data as { usage?: unknown }).usage
      : data;

  if (!isUsageLike(usage)) return null;

  return writeAIUsageCache(usage, fallbackTier);
}

export async function hydrateAIUsageCache(
  fallbackTier?: Tier,
): Promise<AIUsageSnapshot | null> {
  const userId = getActiveUserId();
  if (!userId) return null;

  const cached = readAIUsageCache();
  if (
    cached &&
    Date.now() - cached.updatedAt < AI_USAGE_HYDRATE_STALE_MS
  ) {
    return cached;
  }

  if (!inFlightUsageHydration) {
    inFlightUsageHydration = fetchAIUsageSnapshot(fallbackTier).finally(() => {
      inFlightUsageHydration = null;
    });
  }

  return inFlightUsageHydration;
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

export function useAIUsageSnapshotState(expectedTier?: Tier) {
  const [snapshot, setSnapshot] = useState<AIUsageSnapshot | null>(() =>
    readAIUsageCache(),
  );
  const [hydrating, setHydrating] = useState<boolean>(() => !readAIUsageCache());

  useEffect(() => {
    const refresh = () => {
      setSnapshot(readAIUsageCache());
      setHydrating(false);
    };

    refresh();
    setHydrating(true);
    void hydrateAIUsageCache(expectedTier).then((nextSnapshot) => {
      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
        setHydrating(false);
        return;
      }

      refresh();
    }).catch(() => {
      refresh();
    });

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
  }, [expectedTier]);

  const tierMismatch = Boolean(expectedTier && snapshot?.tier !== expectedTier);

  return {
    snapshot: tierMismatch ? null : snapshot,
    hydrating: tierMismatch ? false : hydrating,
  };
}

export function useAIUsageSnapshot(expectedTier?: Tier) {
  return useAIUsageSnapshotState(expectedTier).snapshot;
}
