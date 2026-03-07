export type ModuleId =
  | "goals"
  | "reading"
  | "nutrition"
  | "fitness"
  | "schedule"
  | "finance"
  | "todos"
  | "skincare";

export type ModuleDef = {
  id: ModuleId;
  label: string;
  emoji: string;
  description: string;
  href: string;
  /** Which nav section this belongs to */
  section: "Daily Plan" | "Goals" | "Other";
  /** Nav label shown in the dropdown */
  navLabel: string;
};

export const ALL_MODULES: ModuleDef[] = [
  {
    id: "goals",
    label: "Goals",
    emoji: "🎯",
    description: "Break big goals into steps and track progress",
    href: "/app/goals",
    section: "Goals",
    navLabel: "🎯 All Goals",
  },
  {
    id: "reading",
    label: "Reading",
    emoji: "📖",
    description: "Track your books and daily reading streak",
    href: "/app/reading",
    section: "Daily Plan",
    navLabel: "📖 Reading",
  },
  {
    id: "nutrition",
    label: "Nutrition",
    emoji: "🥗",
    description: "Log meals and hit your macro targets",
    href: "/app/nutrition",
    section: "Daily Plan",
    navLabel: "🥗 Nutrition",
  },
  {
    id: "fitness",
    label: "Fitness",
    emoji: "🏋️",
    description: "Log workouts, PRs and track consistency",
    href: "/app/fitness",
    section: "Other",
    navLabel: "🏋️ Fitness",
  },
  {
    id: "schedule",
    label: "Schedule",
    emoji: "📅",
    description: "Plan your day with a time-blocked schedule",
    href: "/app/schedule",
    section: "Daily Plan",
    navLabel: "📅 Schedule",
  },
  {
    id: "finance",
    label: "Finance",
    emoji: "💰",
    description: "Track spending and savings goals",
    href: "/app/finance",
    section: "Other",
    navLabel: "💰 Finance",
  },
  {
    id: "todos",
    label: "To-do",
    emoji: "✅",
    description: "Capture and check off daily tasks",
    href: "/app/todos",
    section: "Other",
    navLabel: "✅ To-do",
  },
  {
    id: "skincare",
    label: "Skincare",
    emoji: "🧴",
    description: "Log your routine and track skin progress",
    href: "/app/skincare",
    section: "Other",
    navLabel: "🧴 Skincare",
  },
];

export const MODULE_MAP = Object.fromEntries(
  ALL_MODULES.map((m) => [m.id, m])
) as Record<ModuleId, ModuleDef>;

/** Default modules for new users who skip selection */
export const DEFAULT_MODULES: ModuleId[] = [
  "goals", "reading", "nutrition", "fitness", "schedule", "finance", "todos",
];

/** Always-visible items that aren't tied to a module */
export const ALWAYS_NAV_ITEMS = [
  { label: "📌 Upcoming", href: "/app/upcoming", section: "Goals" as const },
];