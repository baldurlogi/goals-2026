import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CACHE_KEYS } from "@/lib/cacheRegistry";
import { useAuth } from "@/features/auth/authContext";
import { getActiveUserId, scopedKey } from "@/lib/activeUser";

export type Tier = "free" | "pro" | "pro_max";

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

export function tierMeets(userTier: Tier, required: Tier): boolean {
  const rank: Record<Tier, number> = { free: 0, pro: 1, pro_max: 2 };
  return rank[userTier] >= rank[required];
}

const TIER_CACHE_KEY = CACHE_KEYS.USER_TIER;

function tierCacheKey() {
  return scopedKey(TIER_CACHE_KEY, getActiveUserId());
}

function readTierCache(): Tier {
  try {
    const raw = localStorage.getItem(tierCacheKey());
    if (raw === "pro" || raw === "pro_max") return raw;
  } catch {
    // ignore
  }
  return "free";
}

function writeTierCache(tier: Tier) {
  try {
    localStorage.setItem(tierCacheKey(), tier);
  } catch {
    // ignore
  }
}

let currentTier: Tier = readTierCache();
let inFlightTierLoad: Promise<Tier> | null = null;
let inFlightUserId: string | null = null;
const listeners = new Set<(tier: Tier) => void>();

function publishTier(next: Tier) {
  currentTier = next;
  writeTierCache(next);
  listeners.forEach((listener) => listener(next));
}

async function fetchTier(userId: string, force = false): Promise<Tier> {
  if (!force && inFlightTierLoad && inFlightUserId === userId) {
    return inFlightTierLoad;
  }

  inFlightUserId = userId;
  inFlightTierLoad = (async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", userId)
        .single();

      if (error || !data) {
        publishTier(currentTier);
        return currentTier;
      }

      const next = (data.tier as Tier) ?? "free";
      publishTier(next);
      return next;
    } catch {
      publishTier(currentTier);
      return currentTier;
    } finally {
      inFlightTierLoad = null;
      inFlightUserId = null;
    }
  })();

  return inFlightTierLoad;
}

export function useTier(): Tier {
  const { userId, authReady } = useAuth();
  const [tier, setTier] = useState<Tier>(currentTier);

  useEffect(() => {
    listeners.add(setTier);

    if (!authReady || userId === null) {
      publishTier("free");
    } else {
      void fetchTier(userId);
    }

    return () => {
      listeners.delete(setTier);
    };
  }, [authReady, userId]);

  return tier;
}

export function clearTierCache() {
  currentTier = "free";
  try {
    localStorage.removeItem(tierCacheKey());
  } catch {
    // ignore
  }
}
