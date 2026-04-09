import posthog from "posthog-js";

const ONCE_PREFIX = "analytics:once";
const RETURNED_NEXT_DAY_PREFIX = "analytics:return-next-day";

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

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore private mode / quota issues
  }
}

function onceKey(userId: string, event: string): string {
  return `${ONCE_PREFIX}:${userId}:${event}`;
}

function returnedNextDayKey(userId: string): string {
  return `${RETURNED_NEXT_DAY_PREFIX}:${userId}`;
}

function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayDifference(fromDateKey: string, toDateKey: string): number {
  const from = new Date(`${fromDateKey}T00:00:00`);
  const to = new Date(`${toDateKey}T00:00:00`);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

export function capture(
  event: string,
  properties?: Record<string, unknown>,
): boolean {
  try {
    posthog.capture(event, properties);
    return true;
  } catch {
    return false;
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

  const captured = capture(event, properties);
  if (captured) {
    safeWrite(key, "1");
  }
}

export function resetCaptureOnce(
  event: string,
  userId: string | null | undefined,
): void {
  if (!userId) return;
  safeRemove(onceKey(userId, event));
}

export function captureReturnedNextDay(userId: string | null | undefined): void {
  if (!userId) return;

  const key = returnedNextDayKey(userId);
  const today = getLocalDateKey();
  const lastSeenDate = safeRead(key);

  if (lastSeenDate) {
    const diff = getDayDifference(lastSeenDate, today);

    if (diff === 1) {
      const payload = {
        userId,
        lastSeenDate,
        returnedDate: today,
      };

      // Keep the legacy name for continuity, and emit the beta funnel name too.
      capture("returned_next_day", payload);
      capture("session_day_2_return", payload);
    }
  }

  safeWrite(key, today);
}
