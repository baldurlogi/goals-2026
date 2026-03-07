import type { ScheduleConfig, ScheduleView, TimelineItem, UserScheduleTemplates } from "./scheduleTypes";

// ── Generic seed blocks ───────────────────────────────────────────────────
// These are shown to new users before they customise their schedule.
// No personal data — just a sensible starting point.

function block(id: string, time: string, label: string, detail: string, icon: string, tag?: string): TimelineItem {
  return { id, time, label, detail, icon, ...(tag ? { tag } : {}) };
}

export const DEFAULT_WFH_BLOCKS: TimelineItem[] = [
  block("wfh-1",  "7:00",       "Wake up",           "Start your morning routine.",              "⏰"),
  block("wfh-2",  "7:15",       "Morning exercise",  "Walk, stretch, or workout.",               "💪"),
  block("wfh-3",  "7:45",       "Breakfast",         "Fuel up before the day starts.",           "🥣"),
  block("wfh-4",  "8:00",       "Start work",        "Deep work — most important task first.",   "💻"),
  block("wfh-5",  "12:30",      "Lunch break",       "Step away from the screen.",               "🥗"),
  block("wfh-6",  "13:00",      "Back to work",      "Meetings, reviews, lighter tasks.",        "💻"),
  block("wfh-7",  "17:00",      "Finish work",       "Close tabs. Protect your evening.",        "✅"),
  block("wfh-8",  "17:30",      "Exercise / walk",   "Move your body before dinner.",            "🏃"),
  block("wfh-9",  "19:00",      "Dinner",            "Cook or prepare something nourishing.",    "🍽️"),
  block("wfh-10", "20:00",      "Personal project",  "Side project, learning, or reading.",      "🧠"),
  block("wfh-11", "21:30",      "Wind down",         "No screens. Journal or read.",             "📖"),
  block("wfh-12", "22:30",      "Bed",               "Consistent bedtime matters.",              "🌙"),
];

export const DEFAULT_OFFICE_BLOCKS: TimelineItem[] = [
  block("off-1",  "6:30",       "Wake up",           "Earlier start for the commute.",           "⏰"),
  block("off-2",  "6:45",       "Morning exercise",  "Quick workout or walk before leaving.",    "💪"),
  block("off-3",  "7:15",       "Breakfast",         "Eat before you leave.",                    "🥣"),
  block("off-4",  "7:45",       "Commute",           "Podcast, audiobook, or just relax.",       "🚶"),
  block("off-5",  "8:30",       "Arrive at office",  "Get settled, check priorities.",           "🏢"),
  block("off-6",  "12:30",      "Lunch",             "Take a real break away from your desk.",   "🥗"),
  block("off-7",  "17:00",      "Leave office",      "Pack up, head home.",                      "🚶"),
  block("off-8",  "18:00",      "Exercise",          "Gym or walk after commute.",               "🏋️"),
  block("off-9",  "19:30",      "Dinner",            "Keep it simple on busy days.",             "🍽️"),
  block("off-10", "20:30",      "Personal project",  "Even 30 min of focused work counts.",      "🧠"),
  block("off-11", "22:00",      "Wind down & bed",   "Consistent bedtime.",                      "🌙"),
];

export const DEFAULT_WEEKEND_BLOCKS: TimelineItem[] = [
  block("wkd-1",  "8:00",       "Wake up",           "Slightly later — you've earned it.",       "⏰"),
  block("wkd-2",  "8:15",       "Breakfast",         "Take your time. Enjoy the morning.",       "🥣"),
  block("wkd-3",  "9:00",       "Workout / sport",   "Run, swim, gym — whatever you enjoy.",     "🏃"),
  block("wkd-4",  "11:00",      "Errands or chores", "Batch them so the week stays clean.",      "🏠"),
  block("wkd-5",  "13:00",      "Lunch",             "Flexible — eat with family or friends.",   "🥗"),
  block("wkd-6",  "14:00",      "Deep focus (1 hr)", "Side project, learning, or planning.",     "🧠"),
  block("wkd-7",  "17:00",      "Social / free time","Protect this time.",                       "🎉"),
  block("wkd-8",  "19:00",      "Dinner",            "Cook something you enjoy.",                "🍽️"),
  block("wkd-9",  "21:00",      "Weekly review",     "Plan next week. Journal.",                 "📝"),
  block("wkd-10", "22:30",      "Bed",               "Reset for the week ahead.",                "🌙"),
];

export const DEFAULT_USER_SCHEDULE: UserScheduleTemplates = {
  wfh:     DEFAULT_WFH_BLOCKS,
  office:  DEFAULT_OFFICE_BLOCKS,
  weekend: DEFAULT_WEEKEND_BLOCKS,
};

// ── Static schedule config (colours, labels) ─────────────────────────────
// Blocks come from Supabase; only the visual config is hardcoded here.

export const SCHEDULE_CONFIG: Record<ScheduleView, Omit<ScheduleConfig, "blocks">> = {
  wfh: {
    label: "Work From Home",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    accentClass: "border-emerald-200/60 dark:border-emerald-900/60",
  },
  office: {
    label: "Office Day",
    colorClass: "text-amber-600 dark:text-amber-400",
    accentClass: "border-amber-200/60 dark:border-amber-900/60",
  },
  weekend: {
    label: "Weekend",
    colorClass: "text-sky-600 dark:text-sky-400",
    accentClass: "border-sky-200/60 dark:border-sky-900/60",
  },
};

// Helper to merge config + user blocks into a full ScheduleConfig
export function buildScheduleConfig(view: ScheduleView, blocks: TimelineItem[]): ScheduleConfig {
  return { ...SCHEDULE_CONFIG[view], blocks };
}

// Re-export for legacy references
export type { UserScheduleTemplates } from "./scheduleTypes";