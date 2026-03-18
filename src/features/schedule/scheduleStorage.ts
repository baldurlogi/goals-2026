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

async function persistLog(log: ScheduleLog): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("schedule_logs").upsert(
    {
      user_id: user.id,
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
export function seedScheduleLog(): ScheduleLog {
  return readLogCache() ?? { ...DEFAULT_SCHEDULE_LOG, date: getLocalDateKey() };
}

export async function loadScheduleLog(): Promise<ScheduleLog> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const date = todayKey();
  const empty: ScheduleLog = { ...DEFAULT_SCHEDULE_LOG, date };

  if (!user) return empty;

  const cached = readLogCache(user.id);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("schedule_logs")
    .select("log_date, view, completed")
    .eq("user_id", user.id)
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
      .eq("id", user.id)
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

    writeLogCache(next);

    void supabase.from("schedule_logs").upsert(
      {
        user_id: user.id,
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

  writeLogCache(result);
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

export async function setTodayView(view: ScheduleView): Promise<ScheduleLog> {
  const current = await loadScheduleLog();
  const next = commitLogOptimistically(applyViewToLog(current, view));

  try {
    await persistLog(next);
  } catch (error) {
    console.warn("setTodayView persist failed:", error);
    throw error;
  }

  return next;
}

export async function toggleBlock(
  index: number,
  done: boolean,
): Promise<ScheduleLog> {
  const current = await loadScheduleLog();
  const next = commitLogOptimistically(applyToggleToLog(current, index, done));

  try {
    await persistLog(next);
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

export function seedScheduleTemplates(): UserScheduleTemplates {
  return readTemplateCache() ?? DEFAULT_USER_SCHEDULE;
}

export async function loadScheduleTemplates(): Promise<UserScheduleTemplates> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_USER_SCHEDULE;

  const { data, error } = await supabase
    .from("schedule_templates")
    .select("wfh, office, weekend")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    await supabase.from("schedule_templates").upsert(
      {
        user_id: user.id,
        wfh: DEFAULT_USER_SCHEDULE.wfh,
        office: DEFAULT_USER_SCHEDULE.office,
        weekend: DEFAULT_USER_SCHEDULE.weekend,
      },
      { onConflict: "user_id" },
    );
    writeTemplateCache(DEFAULT_USER_SCHEDULE);
    return DEFAULT_USER_SCHEDULE;
  }

  const templates: UserScheduleTemplates = {
    wfh: (data.wfh as TimelineItem[]) ?? DEFAULT_USER_SCHEDULE.wfh,
    office: (data.office as TimelineItem[]) ?? DEFAULT_USER_SCHEDULE.office,
    weekend: (data.weekend as TimelineItem[]) ?? DEFAULT_USER_SCHEDULE.weekend,
  };

  writeTemplateCache(templates, user.id);
  return templates;
}

export async function saveScheduleTemplates(
  templates: UserScheduleTemplates,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("schedule_templates").upsert(
    {
      user_id: user.id,
      wfh: templates.wfh,
      office: templates.office,
      weekend: templates.weekend,
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;

  writeTemplateCache(templates, user.id);
  emit(SCHEDULE_TEMPLATE_EVENT);
}

export async function saveViewBlocks(
  view: ScheduleView,
  blocks: TimelineItem[],
): Promise<void> {
  const current = await loadScheduleTemplates();
  await saveScheduleTemplates({ ...current, [view]: blocks });
}
