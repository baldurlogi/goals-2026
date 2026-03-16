export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toUTCDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function diffDays(aISO: string, bISO: string): number {
  const a = toUTCDate(aISO);
  const b = toUTCDate(bISO);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayISO(d);
}

export function getStartOfWeekMonday(d = new Date()): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);

  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  next.setDate(next.getDate() + diff);
  return next;
}

export function getEndOfWeekSunday(d = new Date()): Date {
  const next = new Date(getStartOfWeekMonday(d));
  next.setDate(next.getDate() + 6);
  return next;
}

export function getWeekStartISO(d = new Date()): string {
  return todayISO(getStartOfWeekMonday(d));
}

export function getWeekEndISO(d = new Date()): string {
  return todayISO(getEndOfWeekSunday(d));
}

export function isISOInCurrentWeek(
  iso: string | null,
  now = new Date(),
): boolean {
  if (!iso) return false;

  const start = getWeekStartISO(now);
  const end = getWeekEndISO(now);

  return iso >= start && iso <= end;
}

export function getDateForWeekIndex(index: number, d = new Date()): Date {
  const next = new Date(getStartOfWeekMonday(d));
  next.setDate(next.getDate() + index);
  return next;
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatWeekRange(d = new Date()): string {
  const start = getStartOfWeekMonday(d);
  const end = getEndOfWeekSunday(d);

  const sameMonth = start.getMonth() === end.getMonth();
  const startMonth = start.toLocaleDateString(undefined, { month: "short" });
  const endMonth = end.toLocaleDateString(undefined, { month: "short" });

  if (sameMonth) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}`;
  }

  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`;
}