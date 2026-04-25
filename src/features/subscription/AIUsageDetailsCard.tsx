import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  defaultMonthlyLimitForTier,
  useAIUsageSnapshotState,
} from "@/features/subscription/aiUsageCache";
import { TIER_BADGE, TIER_LABELS, useTier } from "@/features/subscription/useTier";
import { AI_ACTION_CREDIT_COSTS } from "@/features/subscription/aiCredits";
import {
  PAID_PLANS_COMING_SOON,
  PAID_PLANS_COMING_SOON_LABEL,
} from "@/features/subscription/subscriptionConfig";

type Props = {
  className?: string;
};

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

export function AIUsageDetailsCard({ className }: Props) {
  const tier = useTier();
  const { snapshot, hydrating } = useAIUsageSnapshotState(tier);

  const known = Boolean(snapshot);
  const monthlyLimit = snapshot?.monthlyLimit ?? defaultMonthlyLimitForTier(tier);
  const creditsUsed = snapshot?.creditsUsed ?? null;
  const remaining = snapshot?.remaining ?? null;
  const fillPct = clampPercent((((creditsUsed ?? 0) / monthlyLimit) * 100));
  const exhausted = known && remaining === 0;
  const low =
    known &&
    remaining !== null &&
    remaining > 0 &&
    remaining <= Math.max(1, Math.ceil(monthlyLimit * 0.1));

  return (
    <Card
      className={cn(
        "rounded-2xl border-violet-500/20 bg-gradient-to-br from-violet-500/8 via-background to-background",
        className,
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-base">AI credits</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your monthly AI credit balance and current usage. Resets on the 1st of each month.
              </p>
            </div>
          </div>

          <div className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", TIER_BADGE[tier])}>
            {TIER_LABELS[tier]}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Used
            </div>
            <div className="mt-1 text-2xl font-bold">{creditsUsed ?? "—"}</div>
            <div className="text-xs text-muted-foreground">
              {known ? "credits this month" : hydrating ? "syncing your usage" : "usage unavailable"}
            </div>
          </div>

          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Remaining
            </div>
            <div className="mt-1 text-2xl font-bold">{remaining ?? "—"}</div>
            <div className="text-xs text-muted-foreground">
              {known ? (exhausted ? "limit reached" : "still available") : hydrating ? "checking current month" : "couldn't sync yet"}
            </div>
          </div>

          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Monthly limit
            </div>
            <div className="mt-1 text-2xl font-bold">{monthlyLimit}</div>
            <div className="text-xs text-muted-foreground">based on your plan</div>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border bg-background/70 p-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-foreground">This month</span>
            <span className="text-muted-foreground">
              {known ? `${creditsUsed}/${monthlyLimit} used · ${Math.round(fillPct)}%` : `—/${monthlyLimit} used`}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                exhausted
                  ? "bg-amber-500"
                  : low
                  ? "bg-violet-500"
                  : "bg-primary",
              )}
              style={{ width: `${fillPct}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {known
              ? exhausted
                ? "You've used all available credits for this month. Non-AI features still work normally."
                : `${remaining} credits are still available this month.`
              : hydrating
                ? "Syncing your current month's AI credits."
                : "Current credit usage could not be synced yet. It will update after the next successful AI action."}
          </p>
        </div>

        <div className="rounded-xl border bg-background/70 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Zap className="h-3.5 w-3.5 text-violet-400" />
            What spends credits
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {[
              `Goal generation · ${AI_ACTION_CREDIT_COSTS.goalGeneration} credits`,
              `Improve goal · ${AI_ACTION_CREDIT_COSTS.goalImprove} credits`,
              `Coach suggestion · ${AI_ACTION_CREDIT_COSTS.coachSuggestion} credit`,
              `Weekly report · ${AI_ACTION_CREDIT_COSTS.weeklyReport} credits`,
              `Workout plan · ${AI_ACTION_CREDIT_COSTS.fitnessWeeklyPlan} credits`,
            ].map((item) => (
              <span key={item} className="rounded-full border bg-muted/40 px-2.5 py-1">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">

          {tier !== "pro_max" &&
            (PAID_PLANS_COMING_SOON ? (
              <div className="flex items-center gap-2 rounded-full border border-dashed border-violet-500/25 bg-violet-500/5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                {PAID_PLANS_COMING_SOON_LABEL}
                <Link
                  to="/app/upgrade"
                  className="inline-flex items-center gap-1 text-violet-300 transition-colors hover:text-violet-200"
                >
                  Pricing preview
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/app/upgrade">
                  Pricing preview
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
