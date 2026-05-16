/**
 * UpgradeBanner.tsx
 *
 * Inline banner shown when a feature is locked behind a higher tier.
 * Links to /app/upgrade.
 *
 * Usage:
 *   <UpgradeBanner feature="AI goal optimization" requiredTier="pro" />
 */

import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Lock } from "lucide-react";
import { TIER_LABELS, type Tier } from "@/features/subscription/useTier";

type Props = {
  feature?: string;
  requiredTier?: Tier;
  className?: string;
};

export function UpgradeBanner({
  feature = "This feature",
  requiredTier = "pro",
  className = "",
}: Props) {
  const tierLabel = TIER_LABELS[requiredTier];

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-violet-500/25 bg-violet-500/8 px-4 py-3 sm:flex-nowrap ${className}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
        <Lock className="h-3.5 w-3.5 text-violet-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">
          <span className="text-violet-300">{feature}</span>
          {" "}is available on{" "}
          <span className="font-bold text-violet-300">{tierLabel}</span> and above
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upgrade to unlock AI-powered tools across all your goals
        </p>
      </div>

      <Link
        to="/app/upgrade"
        className="flex min-w-0 max-w-full shrink-0 items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Sparkles className="h-3 w-3" />
        <span className="truncate">Upgrade</span>
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
