import { supabase } from "@/lib/supabaseClient";
import type { ScheduleView } from "@/features/schedule/scheduleTypes";

export const SCHEDULE_CHANGED_EVENT = "schedule:changed";
function emit() { window.dispatchEvent(new Event(SCHEDULE_CHANGED_EVENT)); }
function todayKey() { return new Date().toISOString().slice(0, 10); }

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

  if (error) {
    console.warn("loadScheduleLog error:", error);
    return empty;
  }

  // First time today: create default row
  if (!data) {
    await supabase.from("schedule_logs").insert({
      user_id: user.id,
      log_date: date,
      view: "wfh",
      completed: [],
    });
    return empty;
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
  emit();
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