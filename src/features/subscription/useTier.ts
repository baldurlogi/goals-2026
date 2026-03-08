/**
 * useTier.ts
 *
 * Returns the current user's subscription tier.
 * Reads from the profiles table (tier column).
 * Falls back to "free" if not set or on error.
 *
 * Usage:
 *   const tier = useTier();
 *   const isProOrAbove = tier === "pro" || tier === "pro_max";
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Tier = "free" | "pro" | "pro_max";

export const TIER_LABELS: Record<Tier, string> = {
  free:    "Free",
  pro:     "Pro",
  pro_max: "Pro Max",
};

export const TIER_COLORS: Record<Tier, string> = {
  free:    "text-muted-foreground",
  pro:     "text-violet-400",
  pro_max: "text-amber-400",
};

export const TIER_BADGE: Record<Tier, string> = {
  free:    "bg-muted text-muted-foreground",
  pro:     "bg-violet-500/15 text-violet-400 border border-violet-500/30",
  pro_max: "bg-amber-400/15 text-amber-400 border border-amber-400/30",
};

/** Returns true if tier meets the minimum required tier */
export function tierMeets(userTier: Tier, required: Tier): boolean {
  const rank: Record<Tier, number> = { free: 0, pro: 1, pro_max: 2 };
  return rank[userTier] >= rank[required];
}

const TIER_CACHE_KEY = "cache:user-tier:v1";

function readTierCache(): Tier {
  try {
    const raw = localStorage.getItem(TIER_CACHE_KEY);
    if (raw === "pro" || raw === "pro_max") return raw;
  } catch { /* ignore */ }
  return "free";
}

function writeTierCache(tier: Tier) {
  try { localStorage.setItem(TIER_CACHE_KEY, tier); } catch { /* ignore */ }
}

export function useTier(): Tier {
  // Seed instantly from cache so no flicker
  const [tier, setTier] = useState<Tier>(readTierCache);

  useEffect(() => {
    let cancelled = false;

    async function fetchTier() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("tier")
          .eq("id", user.id)
          .single();

        if (error || !data) return;

        const t = (data.tier as Tier) ?? "free";
        if (!cancelled) {
          setTier(t);
          writeTierCache(t);
        }
      } catch { /* ignore — fail silently to free */ }
    }

    fetchTier();
    return () => { cancelled = true; };
  }, []);

  return tier;
}

/** Clears tier cache on sign-out */
export function clearTierCache() {
  try { localStorage.removeItem(TIER_CACHE_KEY); } catch { /* ignore */ }
}