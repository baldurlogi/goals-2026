import { supabase } from "@/lib/supabaseClient";
import type {
  ScheduleView,
  TimelineItem,
  UserScheduleTemplates,
} from "@/features/schedule/scheduleTypes";
import { DEFAULT_USER_SCHEDULE } from "@/features/schedule/scheduleData";
import {
  normalizeWeeklySchedule,
  type WeekdayKey,
  type WeeklySchedule,
} from "@/features/onboarding/profileStorage";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import {
  getActiveUserId,
  getScopedStorageItem,
  scopedKey,
} from "@/lib/activeUser";

export const SCHEDULE_CHANGED_EVENT = "schedule:changed";
export const SCHEDULE_TEMPLATE_EVENT = "schedule:template:changed";

function emit(event: string) {
  window.dispatchEvent(new Event(event));
}

function todayKey() {
  return getLocalDateKey();
}

const DAY_INDEX_TO_KEY: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function currentWeekdayKey(): WeekdayKey {
  return DAY_INDEX_TO_KEY[new Date().getDay()] ?? "monday";
}

function scheduleValueToView(value: WeeklySchedule[WeekdayKey]): ScheduleView {
  if (value === "office") return "office";
  if (value === "wfh") return "wfh";
  return "weekend";
}

// ── Schedule log (daily check-off) ───────────────────────────────────────

export type ScheduleLog = {
  date: string;
  view: ScheduleView;
  completed: number[];
};

export const DEFAULT_SCHEDULE_LOG: ScheduleLog = {
  date: getLocalDateKey(),
  view: "wfh",
  completed: [],
};

// ── Schedule log cache ────────────────────────────────────────────────────

export const SCHEDULE_LOG_CACHE_KEY = CACHE_KEYS.SCHEDULE_LOG;

function scheduleLogKey(userId: string | null = getActiveUserId()) {
  return scopedKey(SCHEDULE_LOG_CACHE_KEY, userId);
}

function readLogCache(
  userId: string | null = getActiveUserId(),
): ScheduleLog | null {
  try {
    const raw = getScopedStorageItem(SCHEDULE_LOG_CACHE_KEY, userId);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ScheduleLog;
    if (parsed.date !== getLocalDateKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLogCache(
  log: ScheduleLog,
  userId: string | null = getActiveUserId(),
): void {
  try {
    const key = scheduleLogKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(log));
  } catch {
    // ignore
  }
}

function normalizeCompleted(completed: number[]): number[] {
  return Array.from(new Set(completed)).sort((a, b) => a - b);
}

function patchCompleted(
  completed: number[],
  index: number,
  done: boolean,
): number[] {
  if (done) {
    return normalizeCompleted([...completed, index]);
  }

  return completed.filter((i) => i !== index);
}

async function persistLog(userId: string | null = getActiveUserId(), log: ScheduleLog): Promise<void> {
  if (!userId) return;

  const { error } = await supabase.from("schedule_logs").upsert(
    {
      user_id: userId,
      log_date: log.date,
      view: log.view,
      completed: log.completed,
    },
    { onConflict: "user_id,log_date" },
  );

  if (error) throw error;
}

function commitLogOptimistically(log: ScheduleLog): ScheduleLog {
  const next: ScheduleLog = {
    ...log,
    completed: normalizeCompleted(log.completed),
  };

  writeLogCache(next);
  emit(SCHEDULE_CHANGED_EVENT);
  return next;
}

/** Synchronous seed — returns today's schedule log from cache. Zero network. */
export function seedScheduleLog(userId: string | null = getActiveUserId()): ScheduleLog {
  return readLogCache(userId) ?? { ...DEFAULT_SCHEDULE_LOG, date: getLocalDateKey() };
}

export async function loadScheduleLog(userId: string | null = getActiveUserId()): Promise<ScheduleLog> {

  const date = todayKey();
  const empty: ScheduleLog = { ...DEFAULT_SCHEDULE_LOG, date };

  if (!userId) return empty;

  const cached = readLogCache(userId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("schedule_logs")
    .select("log_date, view, completed")
    .eq("user_id", userId)
    .eq("log_date", date)
    .maybeSingle();

  if (error) {
    console.warn("loadScheduleLog error:", error);
    return empty;
  }

  if (!data) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_schedule_view, weekly_schedule")
       .eq("id", userId)
      .single();

    const weeklySchedule = normalizeWeeklySchedule(
      (profile?.weekly_schedule as WeeklySchedule | null | undefined) ?? null,
      (profile?.default_schedule_view as ScheduleView | null | undefined) ??
        null,
    );

    const defaultView = scheduleValueToView(
      weeklySchedule[currentWeekdayKey()],
    );

    const next: ScheduleLog = { ...empty, view: defaultView };

    writeLogCache(next, userId);

    void supabase.from("schedule_logs").upsert(
      {
        user_id: userId,
        log_date: date,
        view: defaultView,
        completed: [],
      },
      { onConflict: "user_id,log_date" },
    );

    return next;
  }

  const result: ScheduleLog = {
    date: data.log_date,
    view: (data.view as ScheduleView) ?? "wfh",
    completed: normalizeCompleted(data.completed ?? []),
  };

  writeLogCache(result, userId);
  return result;
}

export function applyViewToLog(
  log: ScheduleLog,
  view: ScheduleView,
): ScheduleLog {
  return {
    ...log,
    view,
  };
}

export function applyToggleToLog(
  log: ScheduleLog,
  index: number,
  done: boolean,
): ScheduleLog {
  return {
    ...log,
    completed: patchCompleted(log.completed, index, done),
  };
}

export async function setTodayView(
  userIdOrView: string | ScheduleView | null = getActiveUserId(),
  maybeView?: ScheduleView,
): Promise<ScheduleLog> {
  const userId = maybeView === undefined ? getActiveUserId() : userIdOrView as string | null;
  const view = (maybeView === undefined ? userIdOrView : maybeView) as ScheduleView;
  const current = await loadScheduleLog(userId);
  const next = commitLogOptimistically(applyViewToLog(current, view));

  try {
    await persistLog(userId, next);
  } catch (error) {
    console.warn("setTodayView persist failed:", error);
    throw error;
  }

  return next;
}

export async function toggleBlock(
  userIdOrIndex: string | number | null = getActiveUserId(),
  indexOrDone?: number | boolean,
  maybeDone?: boolean,
): Promise<ScheduleLog> {
  const userId = maybeDone === undefined ? getActiveUserId() : userIdOrIndex as string | null;
  const index = (maybeDone === undefined ? userIdOrIndex : indexOrDone) as number;
  const done = (maybeDone === undefined ? indexOrDone : maybeDone) as boolean;
  const current = await loadScheduleLog(userId);
  const next = commitLogOptimistically(applyToggleToLog(current, index, done));

  try {
    await persistLog(userId, next);
  } catch (error) {
    console.warn("toggleBlock persist failed:", error);
    throw error;
  }

  return next;
}

export function getScheduleSummary(log: ScheduleLog, total: number) {
  const done = log.completed.length;
  return {
    done,
    total,
    pct: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

// ── User schedule templates (editable blocks) ────────────────────────────

const TEMPLATE_CACHE_KEY = CACHE_KEYS.SCHEDULE_TEMPLATES;

function scheduleTemplateKey(userId: string | null = getActiveUserId()) {
  return scopedKey(TEMPLATE_CACHE_KEY, userId);
}

function readTemplateCache(
  userId: string | null = getActiveUserId(),
): UserScheduleTemplates | null {
  try {
    const raw = getScopedStorageItem(TEMPLATE_CACHE_KEY, userId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeTemplateCache(
  t: UserScheduleTemplates,
  userId: string | null = getActiveUserId(),
) {
  try {
    const key = scheduleTemplateKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(t));
  } catch {
    return;
  }
}

export function seedScheduleTemplates(userId: string | null = getActiveUserId()): UserScheduleTemplates {
  return readTemplateCache(userId) ?? DEFAULT_USER_SCHEDULE;
}

export async function loadScheduleTemplates(userId: string | null = getActiveUserId()): Promise<UserScheduleTemplates> {
  if (!userId) return DEFAULT_USER_SCHEDULE;

  const { data, error } = await supabase
    .from("schedule_templates")
    .select("wfh, office, weekend")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    await supabase.from("schedule_templates").upsert(
      {
        user_id: userId,
        wfh: DEFAULT_USER_SCHEDULE.wfh,
        office: DEFAULT_USER_SCHEDULE.office,
        weekend: DEFAULT_USER_SCHEDULE.weekend,
      },
      { onConflict: "user_id" },
    );
    writeTemplateCache(DEFAULT_USER_SCHEDULE, userId);
    return DEFAULT_USER_SCHEDULE;
  }

  const templates: UserScheduleTemplates = {
    wfh: (data.wfh as TimelineItem[]) ?? DEFAULT_USER_SCHEDULE.wfh,
    office: (data.office as TimelineItem[]) ?? DEFAULT_USER_SCHEDULE.office,
    weekend: (data.weekend as TimelineItem[]) ?? DEFAULT_USER_SCHEDULE.weekend,
  };

  writeTemplateCache(templates, userId);
  return templates;
}

export async function saveScheduleTemplates(
  userId: string | null = getActiveUserId(),
  templates: UserScheduleTemplates,
): Promise<void> {
  if (!userId) return;

  const { error } = await supabase.from("schedule_templates").upsert(
    {
      user_id: userId,
      wfh: templates.wfh,
      office: templates.office,
      weekend: templates.weekend,
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;

  writeTemplateCache(templates, userId);
  emit(SCHEDULE_TEMPLATE_EVENT);
}

export async function saveViewBlocks(
  userIdOrView: string | ScheduleView | null = getActiveUserId(),
  viewOrBlocks?: ScheduleView | TimelineItem[],
  maybeBlocks?: TimelineItem[],
): Promise<void> {
  const userId = maybeBlocks === undefined ? getActiveUserId() : userIdOrView as string | null;
  const view = (maybeBlocks === undefined ? userIdOrView : viewOrBlocks) as ScheduleView;
  const blocks = (maybeBlocks === undefined ? viewOrBlocks : maybeBlocks) as TimelineItem[];
  const current = await loadScheduleTemplates(userId);
  await saveScheduleTemplates(userId, { ...current, [view]: blocks });
}
