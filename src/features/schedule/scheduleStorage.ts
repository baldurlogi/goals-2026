import { supabase } from "@/lib/supabaseClient";
import type {
  ScheduleDayKey,
  TimelineItem,
  UserScheduleTemplates,
} from "@/features/schedule/scheduleTypes";
import {
  DEFAULT_USER_SCHEDULE,
  SCHEDULE_DAY_ORDER,
  getScheduleDayLabel,
} from "@/features/schedule/scheduleData";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import {
  getActiveUserId,
  getScopedStorageItem,
  scopedKey,
  writeScopedStorageItem,
} from "@/lib/activeUser";

export const SCHEDULE_CHANGED_EVENT = "schedule:changed";
export const SCHEDULE_TEMPLATE_EVENT = "schedule:template:changed";

function emit(event: string) {
  window.dispatchEvent(new Event(event));
}

function todayKey() {
  return getLocalDateKey();
}

function parseDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

export function getScheduleDayKeyForDate(date: string): ScheduleDayKey {
  const dayIndex = parseDate(date).getDay();
  return SCHEDULE_DAY_ORDER[(dayIndex + 6) % 7] ?? "monday";
}

function dayKeyToLegacyView(dayKey: ScheduleDayKey) {
  return dayKey === "saturday" || dayKey === "sunday" ? "weekend" : "wfh";
}

function normalizeTimelineItems(value: unknown): TimelineItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is TimelineItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<TimelineItem>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.time === "string" &&
        typeof candidate.label === "string" &&
        typeof candidate.detail === "string" &&
        typeof candidate.icon === "string"
      );
    })
    .map((item) => ({
      id: item.id,
      time: item.time,
      label: item.label,
      detail: item.detail,
      icon: item.icon,
      ...(item.tag ? { tag: item.tag } : {}),
    }));
}

function resolveTemplate(
  value: unknown,
  fallback: TimelineItem[],
): TimelineItem[] {
  if (value === null || value === undefined) return fallback;
  return normalizeTimelineItems(value);
}

function normalizeTemplates(
  value: Partial<Record<ScheduleDayKey, unknown>> | null | undefined,
): UserScheduleTemplates {
  return {
    monday: resolveTemplate(value?.monday, DEFAULT_USER_SCHEDULE.monday),
    tuesday: resolveTemplate(value?.tuesday, DEFAULT_USER_SCHEDULE.tuesday),
    wednesday: resolveTemplate(value?.wednesday, DEFAULT_USER_SCHEDULE.wednesday),
    thursday: resolveTemplate(value?.thursday, DEFAULT_USER_SCHEDULE.thursday),
    friday: resolveTemplate(value?.friday, DEFAULT_USER_SCHEDULE.friday),
    saturday: resolveTemplate(value?.saturday, DEFAULT_USER_SCHEDULE.saturday),
    sunday: resolveTemplate(value?.sunday, DEFAULT_USER_SCHEDULE.sunday),
  };
}

function getLegacyTemplateFallback(
  value: Partial<Record<"wfh" | "office" | "weekend", unknown>> | null | undefined,
): UserScheduleTemplates {
  const weekdayBlocks =
    normalizeTimelineItems(value?.wfh).length > 0
      ? normalizeTimelineItems(value?.wfh)
      : DEFAULT_USER_SCHEDULE.monday;
  const weekendBlocks =
    normalizeTimelineItems(value?.weekend).length > 0
      ? normalizeTimelineItems(value?.weekend)
      : DEFAULT_USER_SCHEDULE.saturday;

  return {
    monday: weekdayBlocks,
    tuesday: weekdayBlocks,
    wednesday: weekdayBlocks,
    thursday: weekdayBlocks,
    friday: weekdayBlocks,
    saturday: weekendBlocks,
    sunday: weekendBlocks,
  };
}

function isMissingWeekdayTemplateColumns(error: {
  code?: string;
  message?: string;
} | null | undefined) {
  if (!error) return false;

  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST204" ||
    message.includes("monday") ||
    message.includes("tuesday") ||
    message.includes("wednesday") ||
    message.includes("thursday") ||
    message.includes("friday") ||
    message.includes("saturday") ||
    message.includes("sunday")
  );
}

function isMissingTotalBlocksColumn(error: {
  code?: string;
  message?: string;
} | null | undefined) {
  if (!error) return false;

  const message = error.message?.toLowerCase() ?? "";
  return error.code === "PGRST204" || message.includes("total_blocks");
}

export type ScheduleLog = {
  date: string;
  dayKey: ScheduleDayKey;
  completed: number[];
  totalBlocks: number;
};

function buildEmptyLog(
  date = todayKey(),
  totalBlocks = 0,
): ScheduleLog {
  return {
    date,
    dayKey: getScheduleDayKeyForDate(date),
    completed: [],
    totalBlocks,
  };
}

export const DEFAULT_SCHEDULE_LOG: ScheduleLog = buildEmptyLog();

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

    const parsed = JSON.parse(raw) as Partial<ScheduleLog>;
    if (parsed.date !== getLocalDateKey()) return null;

    return {
      date: parsed.date ?? getLocalDateKey(),
      dayKey: getScheduleDayKeyForDate(parsed.date ?? getLocalDateKey()),
      completed: normalizeCompleted(
        Array.isArray(parsed.completed) ? parsed.completed : [],
      ),
      totalBlocks:
        typeof parsed.totalBlocks === "number" && Number.isFinite(parsed.totalBlocks)
          ? parsed.totalBlocks
          : 0,
    };
  } catch {
    return null;
  }
}

function writeLogCache(
  log: ScheduleLog,
  userId: string | null = getActiveUserId(),
): void {
  if (!userId || log.date !== todayKey()) return;

  try {
    const key = scheduleLogKey(userId);
    assertRegisteredCacheWrite(key);
    writeScopedStorageItem(SCHEDULE_LOG_CACHE_KEY, userId, JSON.stringify(log));
  } catch {
    // ignore
  }
}

function normalizeCompleted(completed: number[]): number[] {
  return Array.from(
    new Set(
      completed.filter((value) => Number.isInteger(value) && value >= 0),
    ),
  ).sort((a, b) => a - b);
}

function patchCompleted(
  completed: number[],
  index: number,
  done: boolean,
): number[] {
  if (done) {
    return normalizeCompleted([...completed, index]);
  }

  return completed.filter((item) => item !== index);
}

async function persistLog(
  userId: string | null = getActiveUserId(),
  log: ScheduleLog,
): Promise<void> {
  if (!userId) return;

  const payload = {
    user_id: userId,
    log_date: log.date,
    view: dayKeyToLegacyView(log.dayKey),
    completed: log.completed,
    total_blocks: log.totalBlocks,
  };

  const { error } = await supabase
    .from("schedule_logs")
    .upsert(payload, { onConflict: "user_id,log_date" });

  if (error) {
    if (isMissingTotalBlocksColumn(error)) {
      const { error: fallbackError } = await supabase
        .from("schedule_logs")
        .upsert(
          {
            user_id: userId,
            log_date: log.date,
            view: dayKeyToLegacyView(log.dayKey),
            completed: log.completed,
          },
          { onConflict: "user_id,log_date" },
        );

      if (fallbackError) throw fallbackError;
      return;
    }

    throw error;
  }
}

function commitLogOptimistically(
  log: ScheduleLog,
  userId: string | null = getActiveUserId(),
): ScheduleLog {
  const next: ScheduleLog = {
    ...log,
    completed: normalizeCompleted(
      log.completed.filter((index) => index < log.totalBlocks),
    ),
  };

  writeLogCache(next, userId);
  emit(SCHEDULE_CHANGED_EVENT);
  return next;
}

export function seedScheduleLog(
  userId: string | null = getActiveUserId(),
): ScheduleLog {
  return readLogCache(userId) ?? buildEmptyLog();
}

export async function loadScheduleLog(
  userId: string | null = getActiveUserId(),
  dateOrOptions?: string | { preferCache?: boolean },
  maybeOptions?: { preferCache?: boolean },
): Promise<ScheduleLog> {
  const date = typeof dateOrOptions === "string" ? dateOrOptions : todayKey();
  const preferCache =
    typeof dateOrOptions === "string"
      ? (maybeOptions?.preferCache ?? true)
      : (dateOrOptions?.preferCache ?? true);
  const empty = buildEmptyLog(date);

  if (!userId) return empty;

  const cached = date === todayKey() && preferCache ? readLogCache(userId) : null;
  if (cached) return cached;

  const templates = await loadScheduleTemplates(userId);
  const templateBlocks = templates[empty.dayKey] ?? [];

  const { data, error } = await supabase
    .from("schedule_logs")
    .select("log_date, completed, total_blocks")
    .eq("user_id", userId)
    .eq("log_date", date)
    .maybeSingle();

  if (error && !isMissingTotalBlocksColumn(error)) {
    console.warn("loadScheduleLog error:", error);
    return {
      ...empty,
      totalBlocks: templateBlocks.length,
    };
  }

  if (error && isMissingTotalBlocksColumn(error)) {
    const fallback = await supabase
      .from("schedule_logs")
      .select("log_date, completed")
      .eq("user_id", userId)
      .eq("log_date", date)
      .maybeSingle();

    if (fallback.error) {
      console.warn("loadScheduleLog error:", fallback.error);
      return {
        ...empty,
        totalBlocks: templateBlocks.length,
      };
    }

    if (!fallback.data) {
      const next = {
        ...empty,
        totalBlocks: templateBlocks.length,
      };
      writeLogCache(next, userId);
      void persistLog(userId, next);
      return next;
    }

    const next: ScheduleLog = {
      date: fallback.data.log_date,
      dayKey: getScheduleDayKeyForDate(fallback.data.log_date),
      completed: normalizeCompleted(fallback.data.completed ?? []),
      totalBlocks: templateBlocks.length,
    };

    writeLogCache(next, userId);
    return next;
  }

  if (!data) {
    const next = {
      ...empty,
      totalBlocks: templateBlocks.length,
    };

    writeLogCache(next, userId);
    void persistLog(userId, next);
    return next;
  }

  const result: ScheduleLog = {
    date: data.log_date,
    dayKey: getScheduleDayKeyForDate(data.log_date),
    completed: normalizeCompleted(data.completed ?? []),
    totalBlocks:
      typeof data.total_blocks === "number" && Number.isFinite(data.total_blocks)
        ? data.total_blocks
        : templateBlocks.length,
  };

  writeLogCache(result, userId);
  return result;
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

export async function toggleBlock(
  userIdOrDateOrIndex: string | number | null = getActiveUserId(),
  dateOrIndexOrDone?: string | number | boolean,
  indexOrDone?: number | boolean,
  maybeDone?: boolean,
): Promise<ScheduleLog> {
  const hasExplicitDate =
    typeof dateOrIndexOrDone === "string" && typeof indexOrDone === "number";
  const userId =
    hasExplicitDate || maybeDone !== undefined
      ? (userIdOrDateOrIndex as string | null)
      : getActiveUserId();
  const date = hasExplicitDate ? (dateOrIndexOrDone as string) : todayKey();
  const index = (
    hasExplicitDate
      ? indexOrDone
      : maybeDone === undefined
        ? userIdOrDateOrIndex
        : dateOrIndexOrDone
  ) as number;
  const done = (
    hasExplicitDate
      ? maybeDone
      : maybeDone === undefined
        ? dateOrIndexOrDone
        : indexOrDone
  ) as boolean;

  const current = await loadScheduleLog(userId, date);
  const next = commitLogOptimistically(
    applyToggleToLog(current, index, done),
    userId,
  );

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

const TEMPLATE_CACHE_KEY = CACHE_KEYS.SCHEDULE_TEMPLATES;

function scheduleTemplateKey(userId: string | null = getActiveUserId()) {
  return scopedKey(TEMPLATE_CACHE_KEY, userId);
}

function readTemplateCache(
  userId: string | null = getActiveUserId(),
): UserScheduleTemplates | null {
  try {
    const raw = getScopedStorageItem(TEMPLATE_CACHE_KEY, userId);
    return raw ? normalizeTemplates(JSON.parse(raw) as UserScheduleTemplates) : null;
  } catch {
    return null;
  }
}

function writeTemplateCache(
  templates: UserScheduleTemplates,
  userId: string | null = getActiveUserId(),
) {
  if (!userId) return;

  try {
    const key = scheduleTemplateKey(userId);
    assertRegisteredCacheWrite(key);
    writeScopedStorageItem(TEMPLATE_CACHE_KEY, userId, JSON.stringify(templates));
  } catch {
    // ignore
  }
}

export function seedScheduleTemplates(
  userId: string | null = getActiveUserId(),
): UserScheduleTemplates {
  return readTemplateCache(userId) ?? DEFAULT_USER_SCHEDULE;
}

export async function loadScheduleTemplates(
  userId: string | null = getActiveUserId(),
): Promise<UserScheduleTemplates> {
  if (!userId) return DEFAULT_USER_SCHEDULE;

  const { data, error } = await supabase
    .from("schedule_templates")
    .select("monday, tuesday, wednesday, thursday, friday, saturday, sunday")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && !isMissingWeekdayTemplateColumns(error)) {
    console.warn("loadScheduleTemplates error:", error);
    return DEFAULT_USER_SCHEDULE;
  }

  if (error && isMissingWeekdayTemplateColumns(error)) {
    const legacy = await supabase
      .from("schedule_templates")
      .select("wfh, office, weekend")
      .eq("user_id", userId)
      .maybeSingle();

    if (legacy.error) {
      console.warn("loadScheduleTemplates legacy error:", legacy.error);
      return DEFAULT_USER_SCHEDULE;
    }

    const templates = legacy.data
      ? getLegacyTemplateFallback(legacy.data)
      : DEFAULT_USER_SCHEDULE;

    writeTemplateCache(templates, userId);
    return templates;
  }

  if (!data) {
    const { error: insertError } = await supabase.from("schedule_templates").upsert(
      {
        user_id: userId,
        monday: DEFAULT_USER_SCHEDULE.monday,
        tuesday: DEFAULT_USER_SCHEDULE.tuesday,
        wednesday: DEFAULT_USER_SCHEDULE.wednesday,
        thursday: DEFAULT_USER_SCHEDULE.thursday,
        friday: DEFAULT_USER_SCHEDULE.friday,
        saturday: DEFAULT_USER_SCHEDULE.saturday,
        sunday: DEFAULT_USER_SCHEDULE.sunday,
      },
      { onConflict: "user_id" },
    );

    if (insertError) {
      console.warn("seed schedule templates error:", insertError);
    }

    writeTemplateCache(DEFAULT_USER_SCHEDULE, userId);
    return DEFAULT_USER_SCHEDULE;
  }

  const templates = normalizeTemplates(data);
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
      monday: templates.monday,
      tuesday: templates.tuesday,
      wednesday: templates.wednesday,
      thursday: templates.thursday,
      friday: templates.friday,
      saturday: templates.saturday,
      sunday: templates.sunday,
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;

  writeTemplateCache(templates, userId);
  emit(SCHEDULE_TEMPLATE_EVENT);
}

export async function saveDayBlocks(
  userIdOrDayKey: string | ScheduleDayKey | null = getActiveUserId(),
  dayKeyOrBlocks?: ScheduleDayKey | TimelineItem[],
  blocksOrDate?: TimelineItem[] | string,
  maybeDate?: string,
): Promise<void> {
  const userId =
    maybeDate !== undefined || Array.isArray(blocksOrDate)
      ? (userIdOrDayKey as string | null)
      : getActiveUserId();
  const dayKey = (
    maybeDate !== undefined || Array.isArray(blocksOrDate)
      ? dayKeyOrBlocks
      : userIdOrDayKey
  ) as ScheduleDayKey;
  const blocks = (
    maybeDate !== undefined
      ? blocksOrDate
      : Array.isArray(dayKeyOrBlocks)
        ? dayKeyOrBlocks
        : blocksOrDate
  ) as TimelineItem[];
  const effectiveDate =
    typeof maybeDate === "string"
      ? maybeDate
      : typeof blocksOrDate === "string"
        ? blocksOrDate
        : null;

  const current = await loadScheduleTemplates(userId);
  await saveScheduleTemplates(userId, { ...current, [dayKey]: blocks });

  if (!effectiveDate || getScheduleDayKeyForDate(effectiveDate) !== dayKey) {
    return;
  }

  const currentLog = await loadScheduleLog(userId, effectiveDate, {
    preferCache: false,
  });
  const next = commitLogOptimistically(
    {
      ...currentLog,
      totalBlocks: blocks.length,
      completed: currentLog.completed.filter((index) => index < blocks.length),
    },
    userId,
  );

  try {
    await persistLog(userId, next);
  } catch (error) {
    console.warn(`save ${getScheduleDayLabel(dayKey)} blocks persist failed:`, error);
    throw error;
  }
}
