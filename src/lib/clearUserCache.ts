import {
  LEGACY_USER_SCOPED_EXACT_KEYS,
  LEGACY_USER_SCOPED_PREFIXES,
  USER_SCOPED_CACHE_KEYS,
  USER_SCOPED_CACHE_PREFIXES,
} from "@/lib/cacheRegistry";
import {
  getActiveUserId,
  getUserCacheNamespace,
  legacyScopedKey,
} from "@/lib/activeUser";

type ClearUserCacheOptions = {
  excludeExactKeys?: string[];
};

export function clearUserCache(
  userId: string | null = getActiveUserId(),
  options: ClearUserCacheOptions = {},
) {
  // Query-seed / rollback caches and local-only UX state are the only supported localStorage data here.
  try {
    const namespace = getUserCacheNamespace(userId);
    const keysToRemove = new Set<string>();
    const excluded = new Set(options.excludeExactKeys ?? []);

    for (const key of USER_SCOPED_CACHE_KEYS) {
      if (excluded.has(key)) continue;
      if (namespace) {
        keysToRemove.add(`${key}:${namespace}`);
      }
    }

    for (const key of LEGACY_USER_SCOPED_EXACT_KEYS) {
      keysToRemove.add(key);
    }

    if (userId) {
      for (const key of USER_SCOPED_CACHE_KEYS) {
        if (excluded.has(key)) continue;
        keysToRemove.add(legacyScopedKey(key, userId));
      }
    }

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isNamespacedMatch = namespace
        ? USER_SCOPED_CACHE_PREFIXES.some((prefix) =>
            key.startsWith(`${prefix}${namespace}:`),
          )
        : false;
      const isLegacyPrefixMatch = LEGACY_USER_SCOPED_PREFIXES.some((prefix) =>
        key.startsWith(prefix),
      );

      if (isNamespacedMatch || isLegacyPrefixMatch) {
        keysToRemove.add(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {
    // ignore
  }
}
