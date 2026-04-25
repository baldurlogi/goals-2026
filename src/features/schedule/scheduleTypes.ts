export type TimelineItem = {
  id: string;
  time: string;
  label: string;
  detail: string;
  icon: string;
  tag?: string;
};

export type ScheduleDayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ScheduleView = ScheduleDayKey;

export type ScheduleConfig = {
  dayKey: ScheduleDayKey;
  label: string;
  shortLabel: string;
  colorClass: string;
  accentClass: string;
  blocks: TimelineItem[];
};

export type DailySchedule = Record<ScheduleDayKey, ScheduleConfig>;

export type UserScheduleTemplates = Record<ScheduleDayKey, TimelineItem[]>;
