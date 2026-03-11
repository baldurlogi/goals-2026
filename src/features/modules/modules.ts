import type { LucideIcon } from "lucide-react";
import {
  Target,
  BookOpen,
  Salad,
  Dumbbell,
  CalendarDays,
  Wallet,
  CheckSquare,
  Sparkles,
  Pin,
} from "lucide-react";

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
  description: string;
  href: string;
  icon: LucideIcon;
  section: "Daily Plan" | "Goals" | "Other";
  navLabel: string;
};

export const ALL_MODULES: ModuleDef[] = [
  {
    id: "goals",
    label: "Goals",
    icon: Target,
    description: "Break big goals into steps and track progress",
    href: "/app/goals",
    section: "Goals",
    navLabel: "All Goals",
  },
  {
    id: "reading",
    label: "Reading",
    icon: BookOpen,
    description: "Track your books and daily reading streak",
    href: "/app/reading",
    section: "Daily Plan",
    navLabel: "Reading",
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: Salad,
    description: "Log meals and hit your macro targets",
    href: "/app/nutrition",
    section: "Daily Plan",
    navLabel: "Nutrition",
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: Dumbbell,
    description: "Log workouts, PRs and track consistency",
    href: "/app/fitness",
    section: "Other",
    navLabel: "Fitness",
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: CalendarDays,
    description: "Plan your day with a time-blocked schedule",
    href: "/app/schedule",
    section: "Daily Plan",
    navLabel: "Schedule",
  },
  {
    id: "finance",
    label: "Finance",
    icon: Wallet,
    description: "Track spending and savings goals",
    href: "/app/finance",
    section: "Other",
    navLabel: "Finance",
  },
  {
    id: "todos",
    label: "To-do",
    icon: CheckSquare,
    description: "Capture and check off daily tasks",
    href: "/app/todos",
    section: "Other",
    navLabel: "To-do",
  },
  {
    id: "skincare",
    label: "Skincare",
    icon: Sparkles,
    description: "Log your routine and track skin progress",
    href: "/app/skincare",
    section: "Other",
    navLabel: "Skincare",
  },
];

export const MODULE_MAP = Object.fromEntries(
  ALL_MODULES.map((m) => [m.id, m]),
) as Record<ModuleId, ModuleDef>;

export const DEFAULT_MODULES: ModuleId[] = [
  "goals",
  "reading",
  "nutrition",
  "fitness",
  "schedule",
  "finance",
  "todos",
];

export const ALWAYS_NAV_ITEMS = [
  {
    label: "Upcoming",
    href: "/app/upcoming",
    section: "Goals" as const,
    icon: Pin,
  },
];