export type TimelineItem = {
  id: string;        // uuid for stable keys + reordering
  time: string;
  label: string;
  detail: string;
  icon: string;
  tag?: string;
};

export type ScheduleView = "wfh" | "office" | "weekend";

export type ScheduleConfig = {
  label: string;
  colorClass: string;
  accentClass: string;
  blocks: TimelineItem[];
};

export type DailySchedule = Record<ScheduleView, ScheduleConfig>;

// What gets stored in Supabase per user
export type UserScheduleTemplates = {
  wfh: TimelineItem[];
  office: TimelineItem[];
  weekend: TimelineItem[];
};