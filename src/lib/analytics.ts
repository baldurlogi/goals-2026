import posthog from "posthog-js";

const ONCE_PREFIX = "analytics:once";

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore private mode / quota issues
  }
}

function onceKey(userId: string, event: string): string {
  return `${ONCE_PREFIX}:${userId}:${event}`;
}

export function capture(event: string, properties?: Record<string, unknown>): void {
  try {
    posthog.capture(event, properties);
  } catch {
    // analytics must never break UX
  }
}

export function captureOnce(
  event: string,
  userId: string | null | undefined,
  properties?: Record<string, unknown>,
): void {
  if (!userId) return;

  const key = onceKey(userId, event);
  if (safeRead(key)) return;

  capture(event, properties);
  safeWrite(key, "1");
}
