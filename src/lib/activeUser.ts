import { supabaseProjectRef } from "@/lib/supabaseClient";

const ACTIVE_USER_STORAGE_KEY = "cache:active-user:v1";
const ACTIVE_PROJECT_REF_STORAGE_KEY = "cache:supabase-project-ref:v1";
const CACHE_NAMESPACE_VERSION = "v1";

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function isActiveUser(userId: string | null): userId is string {
  return Boolean(userId) && getActiveUserId() === userId;
}

function warnIfProjectRefChanged(): void {
  if (!import.meta.env.DEV) return;

  try {
    const storage = getStorage();
    if (!storage || !supabaseProjectRef) return;

    const previousProjectRef = storage.getItem(ACTIVE_PROJECT_REF_STORAGE_KEY);

    if (previousProjectRef && previousProjectRef !== supabaseProjectRef) {
      console.warn(
        `[cache] Supabase project ref changed from ${previousProjectRef} to ${supabaseProjectRef}. ` +
          "If localhost and production should share data, verify they point at the same Supabase project.",
      );
    }

    storage.setItem(ACTIVE_PROJECT_REF_STORAGE_KEY, supabaseProjectRef);
  } catch {
    // ignore storage failures
  }
}

warnIfProjectRefChanged();

export function getActiveUserId(): string | null {
  try {
    const storage = getStorage();
    if (!storage) return null;

    const raw = storage.getItem(ACTIVE_USER_STORAGE_KEY);
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function setActiveUserId(userId: string | null): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    if (userId) {
      storage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
      if (supabaseProjectRef) {
        storage.setItem(ACTIVE_PROJECT_REF_STORAGE_KEY, supabaseProjectRef);
      }
      return;
    }

    storage.removeItem(ACTIVE_USER_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

export function getUserCacheNamespace(userId: string | null): string | null {
  if (!userId) return null;

  const projectRef = supabaseProjectRef ?? "unknown-project";
  return `${CACHE_NAMESPACE_VERSION}:${projectRef}:${userId}`;
}

export function scopedKey(baseKey: string, userId: string | null): string {
  const namespace = getUserCacheNamespace(userId);
  return namespace ? `${baseKey}:${namespace}` : baseKey;
}

export function legacyScopedKey(
  baseKey: string,
  userId: string | null,
): string {
  return userId ? `${baseKey}:${userId}` : baseKey;
}

export function getScopedStorageItem(
  baseKey: string,
  userId: string | null,
): string | null {
  try {
    const storage = getStorage();
    if (!storage) return null;

    const namespacedKey = scopedKey(baseKey, userId);
    const namespacedValue = storage.getItem(namespacedKey);
    if (namespacedValue !== null) return namespacedValue;

    if (!isActiveUser(userId)) return null;

    const legacyKey = legacyScopedKey(baseKey, userId);
    const legacyValue = storage.getItem(legacyKey);
    if (legacyValue !== null) {
      storage.setItem(namespacedKey, legacyValue);
      storage.removeItem(legacyKey);
      return legacyValue;
    }

    const unscopedValue = storage.getItem(baseKey);
    if (unscopedValue === null) return null;

    storage.setItem(namespacedKey, unscopedValue);
    storage.removeItem(baseKey);
    return unscopedValue;
  } catch {
    return null;
  }
}

export function removeScopedStorageItem(
  baseKey: string,
  userId: string | null,
): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    storage.removeItem(scopedKey(baseKey, userId));

    if (userId) {
      storage.removeItem(legacyScopedKey(baseKey, userId));
    }
  } catch {
    // ignore storage failures
  }
}
