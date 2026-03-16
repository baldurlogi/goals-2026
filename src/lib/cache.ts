export type DateAwareCacheEntry = {
  date: string;
};

export function parseJsonSafely<T>(
  raw: string | null,
  fallback: T,
  isValid?: (parsed: unknown) => parsed is T,
): T {
  if (!raw) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isValid && !isValid(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function readDateAwareCache<T extends DateAwareCacheEntry>(
  key: string,
  today: string,
  fallback: T,
): T {
  const parsed = parseJsonSafely<T | null>(localStorage.getItem(key), null);

  if (!parsed || parsed.date !== today) return fallback;
  return parsed;
}

export function hasDateAwareCache(
  key: string,
  today: string,
): boolean {
  const parsed = parseJsonSafely<DateAwareCacheEntry | null>(
    localStorage.getItem(key),
    null,
  );

  return Boolean(parsed && parsed.date === today);
}

export function writeDateAwareCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore cache write failures
  }
}

export function readStringCache(key: string, fallback: string): string {
  try {
    const raw = localStorage.getItem(key);
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStringCache(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore cache write failures
  }
}

export function readCache<T>(
  key: string,
  fallback: T,
  isValid?: (parsed: unknown) => parsed is T,
): T {
  return parseJsonSafely(localStorage.getItem(key), fallback, isValid);
}

export function hasCache(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore cache write failures
  }
}

export async function loadWithWriteThrough<T>(
  load: () => Promise<T>,
  write: (value: T) => void,
): Promise<T> {
  const fresh = await load();
  write(fresh);
  return fresh;
}
