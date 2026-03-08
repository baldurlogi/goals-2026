import { Link } from "react-router-dom";
import { Trophy, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ACHIEVEMENTS, RARITY_CONFIG } from "@/features/achievements/achievementDefinitions";
import { useAchievements } from "@/features/achievements/useAchievements";

export function AchievementsCard() {
  const { unlocked, loading } = useAchievements();

  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = unlocked.length;
  const pct = Math.round((unlockedCount / totalCount) * 100);

  const recent = [...unlocked]
    .sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt))
    .slice(0, 3);

  return (
    <Card className="lg:col-span-4 overflow-hidden">
      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Achievements
            </span>
          </div>

          <Link
            to="/app/achievements"
            className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {loading ? (
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : unlockedCount === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No badges yet — keep going 🚀</p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-0 rounded-full bg-amber-500" />
            </div>
            <p className="text-[11px] text-muted-foreground">0 / {totalCount} unlocked</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold tabular-nums text-amber-500">
                  {unlockedCount}
                  <span className="text-sm font-normal text-muted-foreground">/{totalCount}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{pct}% complete</div>
              </div>

              <div className="flex gap-2">
                {recent.map((u) => {
                  const def = ACHIEVEMENTS.find((a) => a.id === u.id);
                  if (!def) return null;
                  const rarity = RARITY_CONFIG[def.rarity];

                  return (
                    <Link
                      key={u.id}
                      to="/app/achievements"
                      title={def.title}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-transform hover:scale-105 ${rarity.borderClass} ${rarity.glowClass}`}
                    >
                      {def.emoji}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}