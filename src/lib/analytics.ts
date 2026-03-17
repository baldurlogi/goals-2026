import posthog from "posthog-js";
import { getLocalDateKey } from "@/hooks/useTodayDate";

const ONCE_PREFIX = "analytics:once";
const LAST_SEEN_DATE_KEY = "app:last-seen-date";

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

function oncePerDayKey(userId: string, event: string, dateKey: string): string {
  return `${ONCE_PREFIX}:${userId}:${event}:${dateKey}`;
}

function yesterdayDateKey(): string {
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return getLocalDateKey(yesterday);
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

function captureOncePerDay(
  event: string,
  userId: string | null | undefined,
  dateKey: string,
  properties?: Record<string, unknown>,
): void {
  if (!userId) return;

  const key = oncePerDayKey(userId, event, dateKey);
  if (safeRead(key)) return;

  capture(event, properties);
  safeWrite(key, "1");
}

export function captureReturnedNextDay(userId: string | null | undefined): void {
  if (!userId) return;

  const today = getLocalDateKey();
  const lastSeen = safeRead(LAST_SEEN_DATE_KEY);
  if (!lastSeen || lastSeen === today) return;

  if (lastSeen === yesterdayDateKey()) {
    captureOncePerDay("returned_next_day", userId, today, {
      days_since_last_seen: 1,
    });
  }
}
