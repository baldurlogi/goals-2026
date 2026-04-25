import { useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Lock, ArrowLeft } from "lucide-react";
import { CATEGORY_CONFIG, RARITY_CONFIG } from "./achievementConfig";
import { ACHIEVEMENTS } from "./achievementList";
import type { AchievementCategory } from "./achievementTypes";
import { useAchievements } from "./useAchievements";
import { formatDateWithPreferences, type UserPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";

function BadgeCard({
  def,
  unlockedAt,
  preferences,
}: {
  def: (typeof ACHIEVEMENTS)[0];
  unlockedAt: string | null;
  preferences: UserPreferences;
}) {
  const rarity = RARITY_CONFIG[def.rarity];
  const isUnlocked = unlockedAt !== null;

  return (
    <div
      className={`group relative flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all duration-300
        ${isUnlocked
          ? `bg-card ${rarity.borderClass} ${rarity.glowClass} hover:scale-[1.02]`
          : "bg-muted/20 border-border/40 opacity-50 grayscale"
        }`}
    >
      {!isUnlocked && (
        <div className="absolute right-3 top-3">
          <Lock className="h-3 w-3 text-muted-foreground/40" />
        </div>
      )}

      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl
          ${isUnlocked ? "bg-card border " + rarity.borderClass : "bg-muted/30"}`}
      >
        {def.emoji}
      </div>

      {isUnlocked && (
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${rarity.badgeClass}`}>
          {rarity.label}
        </span>
      )}

      <div>
        <div className="text-sm font-semibold leading-tight">{def.title}</div>
        <div className="mt-1 text-[11px] text-muted-foreground leading-snug">
          {def.description}
        </div>
      </div>

      {isUnlocked && unlockedAt && (
        <div className="text-[10px] text-muted-foreground/50">
          {formatDateWithPreferences(new Date(unlockedAt), preferences, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      )}
    </div>
  );
}

const ALL_CATEGORIES: (AchievementCategory | "all")[] = [
  "all",
  "goals",
  "fitness",
  "nutrition",
  "reading",
  "todos",
  "water",
  "sleep",
  "wellbeing",
  "skincare",
  "finance",
  "streaks",
  "meta",
];

export function AchievementsPage() {
  const preferences = useUserPreferences();
  const { unlocked, loading } = useAchievements();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");

  const unlockedMap = new Map(unlocked.map((u) => [u.id, u.unlockedAt]));
  const unlockedCount = unlocked.length;
  const totalCount = ACHIEVEMENTS.length;
  const pct = Math.round((unlockedCount / totalCount) * 100);

  const filtered =
    activeCategory === "all"
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => {
    const aDate = unlockedMap.get(a.id);
    const bDate = unlockedMap.get(b.id);
    if (aDate && bDate) return bDate.localeCompare(aDate);
    if (aDate) return -1;
    if (bDate) return 1;
    return 0;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Link
              to="/app"
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading…" : `${unlockedCount} / ${totalCount} unlocked`}
              </p>
            </div>
          </div>
        </div>

        {!loading && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums text-amber-500">
                {pct}%
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {totalCount - unlockedCount} remaining
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map((cat) => {
          const config =
            cat === "all" ? { label: "All", emoji: "🏆" } : CATEGORY_CONFIG[cat];
          const isActive = activeCategory === cat;
          const count =
            cat === "all"
              ? unlockedCount
              : ACHIEVEMENTS.filter(
                  (a) => a.category === cat && unlockedMap.has(a.id),
                ).length;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all
                ${isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
            >
              <span>{config.emoji}</span>
              <span>{config.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-white/20" : "bg-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted/30" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-6 py-10 text-center">
          <Trophy className="mx-auto mb-3 h-6 w-6 text-muted-foreground/30" />
          <p className="text-sm font-medium">No achievements in this category yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep going — they’ll unlock as you use Life OS.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((achievement) => (
            <BadgeCard
              key={achievement.id}
              def={achievement}
              unlockedAt={unlockedMap.get(achievement.id) ?? null}
              preferences={preferences}
            />
          ))}
        </div>
      )}
    </div>
  );
}
