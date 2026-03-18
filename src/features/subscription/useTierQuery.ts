import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { CACHE_KEYS } from "@/lib/cacheRegistry";
import { getActiveUserId, scopedKey } from "@/lib/activeUser";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import type { Tier } from "./useTier";

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

async function fetchTier(userId: string | null): Promise<Tier> {
  if (!userId) {
    writeTierCache("free");
    return "free";
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return readTierCache();
  }

  const next = (data.tier as Tier) ?? "free";
  writeTierCache(next);
  return next;
}

export function useTierQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<Tier>({
    queryKey: queryKeys.tier(userId),
    queryFn: () => fetchTier(userId),
    enabled: authReady,
    initialData: readTierCache(),
    staleTime: 1000 * 60 * 5,
  });
}

export function clearTierCache() {
  try {
    localStorage.removeItem(tierCacheKey());
  } catch {
    // ignore
  }
}
