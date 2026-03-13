import type { AchievementCategory, AchievementRarity } from "./achievementTypes";

export const RARITY_CONFIG: Record<
  AchievementRarity,
  {
    label: string;
    glowClass: string;
    borderClass: string;
    badgeClass: string;
    textClass: string;
  }
> = {
  common: {
    label: "Common",
    glowClass: "",
    borderClass: "border-border",
    badgeClass: "bg-muted text-muted-foreground",
    textClass: "text-muted-foreground",
  },
  rare: {
    label: "Rare",
    glowClass: "shadow-[0_0_12px_2px_rgba(59,130,246,0.25)]",
    borderClass: "border-blue-500/40",
    badgeClass: "bg-blue-500/15 text-blue-400",
    textClass: "text-blue-400",
  },
  epic: {
    label: "Epic",
    glowClass: "shadow-[0_0_16px_3px_rgba(168,85,247,0.3)]",
    borderClass: "border-purple-500/50",
    badgeClass: "bg-purple-500/15 text-purple-400",
    textClass: "text-purple-400",
  },
  legendary: {
    label: "Legendary",
    glowClass: "shadow-[0_0_24px_4px_rgba(251,191,36,0.35)]",
    borderClass: "border-amber-400/60",
    badgeClass: "bg-amber-400/15 text-amber-400",
    textClass: "text-amber-400",
  },
};

export const CATEGORY_CONFIG: Record<
  AchievementCategory,
  { label: string; emoji: string }
> = {
  goals: { label: "Goals", emoji: "🎯" },
  fitness: { label: "Fitness", emoji: "💪" },
  nutrition: { label: "Nutrition", emoji: "🥗" },
  reading: { label: "Reading", emoji: "📚" },
  todos: { label: "To-do", emoji: "✅" },
  streaks: { label: "Streaks", emoji: "🔥" },
  meta: { label: "Meta", emoji: "⭐" },
};
