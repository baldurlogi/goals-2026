import { supabase } from "@/lib/supabaseClient";
import type { ScheduleView, TimelineItem, UserScheduleTemplates } from "@/features/schedule/scheduleTypes";
import { DEFAULT_USER_SCHEDULE } from "@/features/schedule/scheduleData";

export const SCHEDULE_CHANGED_EVENT  = "schedule:changed";
export const SCHEDULE_TEMPLATE_EVENT = "schedule:template:changed";

function emit(event: string) { window.dispatchEvent(new Event(event)); }
function todayKey() { return new Date().toISOString().slice(0, 10); }

// ── Schedule log (daily check-off) ───────────────────────────────────────

export const DEFAULT_SCHEDULE_LOG: ScheduleLog = {
  date: new Date().toISOString().slice(0, 10),
  view: "wfh",
  completed: [],
};

export type ScheduleLog = {
  date:      string;
  view:      ScheduleView;
  completed: number[];
};

export async function loadScheduleLog(): Promise<ScheduleLog> {
  const { data: { user } } = await supabase.auth.getUser();
  const date = todayKey();
  const empty: ScheduleLog = { ...DEFAULT_SCHEDULE_LOG, date };
  if (!user) return empty;

  const { data, error } = await supabase
    .from("schedule_logs")
    .select("log_date, view, completed")
    .eq("user_id", user.id)
    .eq("log_date", date)
    .maybeSingle();

  if (error) { console.warn("loadScheduleLog error:", error); return empty; }

  if (!data) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_schedule_view")
      .eq("id", user.id)
      .single();

    const defaultView = (profile?.default_schedule_view as ScheduleView) ?? "wfh";
    await supabase.from("schedule_logs").insert({
      user_id: user.id, log_date: date, view: defaultView, completed: [],
    });
    return { ...empty, view: defaultView };
  }

  return {
    date: data.log_date,
    view: (data.view as ScheduleView) ?? "wfh",
    completed: data.completed ?? [],
  };
}

async function saveLog(log: ScheduleLog): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("schedule_logs").upsert({
    user_id: user.id, log_date: log.date, view: log.view, completed: log.completed,
  }, { onConflict: "user_id,log_date" });
  emit(SCHEDULE_CHANGED_EVENT);
}

export async function setTodayView(view: ScheduleView): Promise<void> {
  const log = await loadScheduleLog();
  log.view = view;
  await saveLog(log);
}

export async function toggleBlock(index: number, done: boolean): Promise<void> {
  const log = await loadScheduleLog();
  if (done) {
    if (!log.completed.includes(index)) log.completed.push(index);
  } else {
    log.completed = log.completed.filter((i) => i !== index);
  }
  await saveLog(log);
}

export function getScheduleSummary(log: ScheduleLog, total: number) {
  const done = log.completed.length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

// ── User schedule templates (editable blocks) ────────────────────────────

const TEMPLATE_CACHE_KEY = "cache:schedule:templates:v1";

function readTemplateCache(): UserScheduleTemplates | null {
  try {
    const raw = localStorage.getItem(TEMPLATE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeTemplateCache(t: UserScheduleTemplates) {
  try {
    localStorage.setItem(TEMPLATE_CACHE_KEY, JSON.stringify(t));
  } catch {
    return;
  }
}

export function seedScheduleTemplates(): UserScheduleTemplates {
  return readTemplateCache() ?? DEFAULT_USER_SCHEDULE;
}

export async function loadScheduleTemplates(): Promise<UserScheduleTemplates> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_USER_SCHEDULE;

  const { data, error } = await supabase
    .from("schedule_templates")
    .select("wfh, office, weekend")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    await supabase.from("schedule_templates").upsert({
      user_id: user.id,
      wfh:     DEFAULT_USER_SCHEDULE.wfh,
      office:  DEFAULT_USER_SCHEDULE.office,
      weekend: DEFAULT_USER_SCHEDULE.weekend,
    }, { onConflict: "user_id" });
    writeTemplateCache(DEFAULT_USER_SCHEDULE);
    return DEFAULT_USER_SCHEDULE;
  }

  const templates: UserScheduleTemplates = {
    wfh:     (data.wfh     as TimelineItem[]) ?? DEFAULT_USER_SCHEDULE.wfh,
    office:  (data.office  as TimelineItem[]) ?? DEFAULT_USER_SCHEDULE.office,
    weekend: (data.weekend as TimelineItem[]) ?? DEFAULT_USER_SCHEDULE.weekend,
  };

  writeTemplateCache(templates);
  return templates;
}

export async function saveScheduleTemplates(templates: UserScheduleTemplates): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("schedule_templates").upsert({
    user_id: user.id,
    wfh:     templates.wfh,
    office:  templates.office,
    weekend: templates.weekend,
  }, { onConflict: "user_id" });

  if (error) throw error;

  writeTemplateCache(templates);
  emit(SCHEDULE_TEMPLATE_EVENT);
}

export async function saveViewBlocks(view: ScheduleView, blocks: TimelineItem[]): Promise<void> {
  const current = await loadScheduleTemplates();
  await saveScheduleTemplates({ ...current, [view]: blocks });
}