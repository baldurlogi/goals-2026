import type {
  ScheduleConfig,
  ScheduleDayKey,
  TimelineItem,
  UserScheduleTemplates,
} from "./scheduleTypes";

function block(
  id: string,
  time: string,
  label: string,
  detail: string,
  icon: string,
  tag?: string,
): TimelineItem {
  return { id, time, label, detail, icon, ...(tag ? { tag } : {}) };
}

function cloneBlocks(
  blocks: TimelineItem[],
  prefix: ScheduleDayKey,
): TimelineItem[] {
  return blocks.map((item, index) => ({
    ...item,
    id: `${prefix}-${index + 1}`,
  }));
}

const DEFAULT_WORKDAY_BLOCKS: TimelineItem[] = [
  block("workday-1", "7:00", "Wake up", "Start your morning routine.", "⏰"),
  block("workday-2", "7:15", "Morning exercise", "Walk, stretch, or workout.", "💪"),
  block("workday-3", "7:45", "Breakfast", "Fuel up before the day starts.", "🥣"),
  block("workday-4", "8:30", "Start work", "Deep work first while your energy is high.", "💻"),
  block("workday-5", "12:30", "Lunch break", "Step away and reset properly.", "🥗"),
  block("workday-6", "13:15", "Back to work", "Meetings, reviews, and lighter tasks.", "💻"),
  block("workday-7", "17:00", "Finish work", "Wrap up and protect your evening.", "✅"),
  block("workday-8", "17:30", "Exercise / walk", "Move before dinner if you can.", "🏃"),
  block("workday-9", "19:00", "Dinner", "Cook or prepare something simple.", "🍽️"),
  block("workday-10", "20:15", "Personal time", "Read, learn, or work on a project.", "🧠"),
  block("workday-11", "22:15", "Wind down", "Screens down and slow the pace.", "🌙"),
];

const DEFAULT_SATURDAY_BLOCKS: TimelineItem[] = [
  block("saturday-1", "8:00", "Wake up", "Easier start than weekdays.", "⏰"),
  block("saturday-2", "8:30", "Breakfast", "Take your time this morning.", "🥣"),
  block("saturday-3", "10:00", "Workout", "Run, swim, gym, or something outdoors.", "🏋️"),
  block("saturday-4", "12:30", "Lunch", "Recharge before the afternoon.", "🥗"),
  block("saturday-5", "14:00", "Errands or chores", "Clear a few things off your list.", "🏠"),
  block("saturday-6", "17:00", "Social / free time", "Make room for fun and recovery.", "🎉"),
  block("saturday-7", "19:30", "Dinner", "Enjoy a slower evening meal.", "🍽️"),
  block("saturday-8", "22:30", "Bed", "Reset for tomorrow.", "🌙"),
];

const DEFAULT_SUNDAY_BLOCKS: TimelineItem[] = [
  block("sunday-1", "8:30", "Wake up", "Keep the morning gentle.", "⏰"),
  block("sunday-2", "9:00", "Breakfast", "Start the day slowly.", "🥣"),
  block("sunday-3", "11:00", "Walk or recovery", "Move a little and clear your head.", "🚶"),
  block("sunday-4", "13:00", "Lunch", "Keep it simple.", "🥗"),
  block("sunday-5", "15:00", "Weekly review", "Look ahead before the week starts.", "📝"),
  block("sunday-6", "16:00", "Prep for the week", "Food, calendar, and priorities.", "📅"),
  block("sunday-7", "19:00", "Dinner", "Settle into the evening.", "🍽️"),
  block("sunday-8", "21:30", "Wind down", "Make Monday easier on yourself.", "📖"),
  block("sunday-9", "22:30", "Bed", "Consistent sleep helps all week.", "🌙"),
];

export const SCHEDULE_DAY_ORDER: ScheduleDayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DEFAULT_USER_SCHEDULE: UserScheduleTemplates = {
  monday: cloneBlocks(DEFAULT_WORKDAY_BLOCKS, "monday"),
  tuesday: cloneBlocks(DEFAULT_WORKDAY_BLOCKS, "tuesday"),
  wednesday: cloneBlocks(DEFAULT_WORKDAY_BLOCKS, "wednesday"),
  thursday: cloneBlocks(DEFAULT_WORKDAY_BLOCKS, "thursday"),
  friday: cloneBlocks(DEFAULT_WORKDAY_BLOCKS, "friday"),
  saturday: cloneBlocks(DEFAULT_SATURDAY_BLOCKS, "saturday"),
  sunday: cloneBlocks(DEFAULT_SUNDAY_BLOCKS, "sunday"),
};

export const SCHEDULE_CONFIG: Record<
  ScheduleDayKey,
  Omit<ScheduleConfig, "blocks">
> = {
  monday: {
    dayKey: "monday",
    label: "Monday",
    shortLabel: "Mon",
    colorClass: "text-sky-600 dark:text-sky-400",
    accentClass: "border-sky-200/60 dark:border-sky-900/60",
  },
  tuesday: {
    dayKey: "tuesday",
    label: "Tuesday",
    shortLabel: "Tue",
    colorClass: "text-indigo-600 dark:text-indigo-400",
    accentClass: "border-indigo-200/60 dark:border-indigo-900/60",
  },
  wednesday: {
    dayKey: "wednesday",
    label: "Wednesday",
    shortLabel: "Wed",
    colorClass: "text-violet-600 dark:text-violet-400",
    accentClass: "border-violet-200/60 dark:border-violet-900/60",
  },
  thursday: {
    dayKey: "thursday",
    label: "Thursday",
    shortLabel: "Thu",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    accentClass: "border-emerald-200/60 dark:border-emerald-900/60",
  },
  friday: {
    dayKey: "friday",
    label: "Friday",
    shortLabel: "Fri",
    colorClass: "text-amber-600 dark:text-amber-400",
    accentClass: "border-amber-200/60 dark:border-amber-900/60",
  },
  saturday: {
    dayKey: "saturday",
    label: "Saturday",
    shortLabel: "Sat",
    colorClass: "text-fuchsia-600 dark:text-fuchsia-400",
    accentClass: "border-fuchsia-200/60 dark:border-fuchsia-900/60",
  },
  sunday: {
    dayKey: "sunday",
    label: "Sunday",
    shortLabel: "Sun",
    colorClass: "text-rose-600 dark:text-rose-400",
    accentClass: "border-rose-200/60 dark:border-rose-900/60",
  },
};

export function getScheduleDayLabel(dayKey: ScheduleDayKey) {
  return SCHEDULE_CONFIG[dayKey].label;
}

export function buildScheduleConfig(
  dayKey: ScheduleDayKey,
  blocks: TimelineItem[],
): ScheduleConfig {
  return { ...SCHEDULE_CONFIG[dayKey], blocks };
}

export type { UserScheduleTemplates } from "./scheduleTypes";
