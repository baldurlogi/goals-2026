import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Zap } from "lucide-react";
import {
  BETA_FREE_TIER_UNLOCKS_PRO,
  TIER_LABELS,
  useTier,
  type Tier,
} from "@/features/subscription/useTier";
import { Button } from "@/components/ui/button";
import { BETA_MONTHLY_AI_CREDITS } from "@/features/subscription/aiCredits";
import {
  PAID_PLANS_COMING_SOON,
} from "@/features/subscription/subscriptionConfig";

type Props = {
  tier?: Tier;
  feature?: string;
  message?: string;
  className?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

function nextTierFor(tier: Tier): Tier | null {
  if (tier === "free") {
    return BETA_FREE_TIER_UNLOCKS_PRO ? null : "pro";
  }

  if (tier === "pro") return "pro_max";
  return null;
}

function defaultMessageForTier(tier: Tier) {
  if (BETA_FREE_TIER_UNLOCKS_PRO) {
    return `You've used all ${BETA_MONTHLY_AI_CREDITS.toLocaleString()} beta AI credits this month. Your balance resets on the 1st.`;
  }

  if (tier === "free") {
    return "You've used all 10 free AI credits this month. Upgrade to Pro for 200 credits/month.";
  }

  if (tier === "pro") {
    return "You've used all 200 Pro AI credits this month. Upgrade to Pro Max for 1,000 credits/month.";
  }

  return "You've used all 1,000 AI credits this month. Your balance resets on the 1st.";
}

export function AIUsageLimitNotice({
  tier,
  feature = "This AI feature",
  message,
  className = "",
  secondaryActionLabel,
  onSecondaryAction,
}: Props) {
  const liveTier = useTier();
  const activeTier = tier ?? liveTier;
  const nextTier = nextTierFor(activeTier);
  const nextTierLabel = nextTier ? TIER_LABELS[nextTier] : null;

  return (
    <div
      className={`rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
          <Zap className="h-4 w-4 text-amber-500" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Monthly AI limit reached
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">{feature}</span>{" "}
            can’t generate more AI output right now.{" "}
            {message ?? defaultMessageForTier(activeTier)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </Button>
        )}

        {nextTier && nextTierLabel && (
          <Button asChild size="sm" className="max-w-full gap-1.5">
            <Link to="/app/upgrade">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="min-w-0 truncate">
                {PAID_PLANS_COMING_SOON
                  ? "Pricing preview"
                  : `Upgrade to ${nextTierLabel}`}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
