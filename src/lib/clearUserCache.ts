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

export function clearUserCache(userId: string | null = getActiveUserId()) {
  try {
    const namespace = getUserCacheNamespace(userId);
    const keysToRemove = new Set<string>();

    for (const key of USER_SCOPED_CACHE_KEYS) {
      if (namespace) {
        keysToRemove.add(`${key}:${namespace}`);
      }
    }

    for (const key of LEGACY_USER_SCOPED_EXACT_KEYS) {
      keysToRemove.add(key);
    }

    if (userId) {
      for (const key of USER_SCOPED_CACHE_KEYS) {
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
