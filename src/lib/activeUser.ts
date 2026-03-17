const ACTIVE_USER_STORAGE_KEY = "cache:active-user:v1";

export function getActiveUserId(): string | null {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function setActiveUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
      return;
    }

    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

export function scopedKey(baseKey: string, userId: string | null): string {
  return userId ? `${baseKey}:${userId}` : baseKey;
}
