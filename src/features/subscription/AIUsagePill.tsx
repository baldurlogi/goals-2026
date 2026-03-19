import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { TIER_LABELS, useTier } from "@/features/subscription/useTier";
import {
  defaultMonthlyLimitForTier,
  useAIUsageSnapshot,
} from "@/features/subscription/aiUsageCache";

export function AIUsagePill({ className = "" }: { className?: string }) {
  const tier = useTier();
  const snapshot = useAIUsageSnapshot(tier);

  const usage = snapshot ?? null;
  const monthlyLimit = usage?.monthlyLimit ?? defaultMonthlyLimitForTier(tier);
  const promptsUsed = usage?.promptsUsed ?? null;
  const remaining = usage?.remaining ?? null;

  const exhausted = remaining === 0;
  const low =
    remaining !== null &&
    remaining > 0 &&
    remaining <= Math.max(1, Math.ceil(monthlyLimit * 0.1));

  const shellTone = exhausted
    ? "border-amber-500/25 bg-amber-500/8"
    : low
      ? "border-violet-500/25 bg-violet-500/8"
      : "border-border bg-card";

  const iconTone = exhausted
    ? "bg-amber-500/15 text-amber-500"
    : "bg-violet-500/15 text-violet-400";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-full border px-3 py-2 text-xs ${shellTone} ${className}`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconTone}`}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </span>

      {usage ? (
        exhausted ? (
          <span className="font-medium">
            AI limit reached · {promptsUsed}/{monthlyLimit} used
          </span>
        ) : (
          <span>
            <span className="font-semibold text-foreground">{remaining}</span>{" "}
            AI prompts left · {promptsUsed}/{monthlyLimit} used
          </span>
        )
      ) : (
        <span>
          <span className="font-semibold text-foreground">{TIER_LABELS[tier]}</span>{" "}
          · {monthlyLimit} AI prompts / month
        </span>
      )}

      {!usage && (
        <span className="hidden text-muted-foreground sm:inline">
          updates after first AI use
        </span>
      )}

      {tier !== "pro_max" && (
        <Link
          to="/app/upgrade"
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          Upgrade
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}