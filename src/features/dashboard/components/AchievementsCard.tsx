import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ACHIEVEMENTS } from "@/features/achievements/achievementList";
import { RARITY_CONFIG } from "@/features/achievements/achievementConfig";
import { useAchievements } from "@/features/achievements/useAchievements";
import { DashboardEmptyState } from "./DashboardEmptyState";

export function AchievementsCard() {
  const { unlocked, loading } = useAchievements();

  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = unlocked.length;
  const pct = Math.round((unlockedCount / totalCount) * 100);
  const showLoadingState = loading && unlockedCount === 0;

  const recent = [...unlocked]
    .sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt))
    .slice(0, 3);

  return (
    <Card className="ai-layer min-h-[170px] overflow-hidden border-0 bg-transparent shadow-none lg:col-span-4">
      <CardHeader className="pb-2 pt-5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/15">
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Milestones
            </span>
          </div>

          <Link
            to="/app/achievements"
            className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {showLoadingState ? (
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-11 w-11 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : unlockedCount === 0 ? (
          <div className="space-y-2">
            <DashboardEmptyState
              icon={<Sparkles className="h-4 w-4 text-cyan-500" />}
              title="First marker is close"
              message="One small action gives the system enough signal to reflect momentum back to you."
              actionLabel="View milestones"
              href="/app/achievements"
              hint="Consistency feels better when it has a visible trace."
            />
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-0 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              0 / {totalCount} markers discovered
            </p>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-bold tabular-nums text-cyan-500">
                  {unlockedCount}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{totalCount}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {pct}% of markers discovered
                </div>
              </div>

              <div className="flex min-w-0 max-w-[58%] gap-2">
                {recent.map((u) => {
                  const def = ACHIEVEMENTS.find((achievement) => achievement.id === u.id);
                  if (!def) return null;

                  const rarity = RARITY_CONFIG[def.rarity];

                  return (
                    <Link
                      key={u.id}
                      to="/app/achievements"
                      title={def.title}
                      className={`ai-layer-soft group flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 transition-all duration-500 hover:-translate-y-0.5 ${rarity.glowClass}`}
                    >
                      <span className="text-sm opacity-80 transition-transform duration-500 group-hover:scale-110">
                        {def.emoji}
                      </span>
                      <span className="min-w-0 truncate text-[10px] font-semibold text-muted-foreground">
                        {def.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="relative h-2 overflow-hidden rounded-full bg-muted shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400 shadow-[0_0_18px_rgba(103,232,249,0.26)] transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-35 animate-[ai-sheen_6s_ease-in-out_infinite]" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
