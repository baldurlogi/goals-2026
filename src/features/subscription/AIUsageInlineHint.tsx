import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIER_LABELS, useTier } from "@/features/subscription/useTier";
import {
  defaultMonthlyLimitForTier,
  useAIUsageSnapshot,
} from "@/features/subscription/aiUsageCache";

type Props = {
  actionLabel?: string;
  className?: string;
  showUpgrade?: boolean;
};

export function AIUsageInlineHint({
  actionLabel = "Uses 1 AI prompt",
  className,
  showUpgrade = true,
}: Props) {
  const tier = useTier();
  const snapshot = useAIUsageSnapshot(tier);

  const monthlyLimit = snapshot?.monthlyLimit ?? defaultMonthlyLimitForTier(tier);
  const remaining = snapshot?.remaining ?? null;
  const exhausted = remaining === 0;
  const low =
    remaining !== null &&
    remaining > 0 &&
    remaining <= Math.max(1, Math.ceil(monthlyLimit * 0.1));

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-[11px]",
        exhausted
          ? "border-amber-500/25 bg-amber-500/8 text-amber-200"
          : low
          ? "border-violet-500/20 bg-violet-500/8 text-violet-200"
          : "border-border bg-muted/30 text-muted-foreground",
        className,
      )}
    >
      <Sparkles className="h-3 w-3 shrink-0 text-violet-400" />

      <span>
        <span className="font-medium text-foreground">{actionLabel}</span>
        {remaining !== null ? (
          <>
            {" "}·{" "}
            <span className="font-semibold text-foreground">{remaining}</span> left this month
          </>
        ) : (
          <>
            {" "}· {TIER_LABELS[tier]} plan · {monthlyLimit}/month
          </>
        )}
      </span>

      {showUpgrade && tier !== "pro_max" && (
        <Link
          to="/app/upgrade"
          className="ml-auto inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          Upgrade
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
