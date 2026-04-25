/**
 * UpgradePage.tsx — /app/upgrade
 * STRIPE_DISABLED = true → "Coming soon" for real users
 * Set to false when ready to charge real money.
 * Test card: 4242 4242 4242 4242 — any future date, any CVC
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  ArrowLeft,
  Lock,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useTier, TIER_BADGE, type Tier } from "@/features/subscription/useTier";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from "@supabase/supabase-js";
import { capture } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  PAID_PLANS_COMING_SOON,
  PAID_PLANS_COMING_SOON_LABEL,
  PAID_PLANS_PREVIEW_MESSAGE,
  SUBSCRIPTION_COMPARISON_ROWS,
  SUBSCRIPTION_PLAN_DEFINITIONS,
} from "@/features/subscription/subscriptionConfig";

const STRIPE_DISABLED = PAID_PLANS_COMING_SOON;

const PRICE_KEYS = {
  pro: { monthly: "pro_monthly", yearly: "pro_yearly" },
  pro_max: { monthly: "pro_max_monthly", yearly: "pro_max_yearly" },
} as const;

type PriceKey =
  | "pro_monthly"
  | "pro_yearly"
  | "pro_max_monthly"
  | "pro_max_yearly";

type Plan = {
  id: Tier;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  yearlySaving: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  borderClass: string;
  glowClass: string;
  buttonClass: string;
  badge?: string;
  features: { text: string; included: boolean }[];
};

const PLAN_UI: Record<
  Tier,
  Pick<Plan, "icon" | "color" | "borderClass" | "glowClass" | "buttonClass">
> = {
  free: {
    icon: <Zap className="h-5 w-5" />,
    color: "text-muted-foreground",
    borderClass: "border-border",
    glowClass: "",
    buttonClass: "bg-muted text-muted-foreground cursor-default",
  },
  pro: {
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-violet-400",
    borderClass: "border-violet-500/50",
    glowClass: "shadow-[0_0_24px_2px_rgba(139,92,246,0.15)]",
    buttonClass: "bg-violet-600 text-white hover:bg-violet-500",
  },
  pro_max: {
    icon: <Crown className="h-5 w-5" />,
    color: "text-amber-400",
    borderClass: "border-amber-400/50",
    glowClass: "shadow-[0_0_24px_2px_rgba(251,191,36,0.15)]",
    buttonClass:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90",
  },
};

const PLANS: Plan[] = (["free", "pro", "pro_max"] as const).map((tier) => {
  const plan = SUBSCRIPTION_PLAN_DEFINITIONS[tier];
  const ui = PLAN_UI[tier];

  return {
    id: plan.id,
    name: plan.label,
    monthlyPrice: plan.monthlyPriceLabel,
    yearlyPrice: plan.yearlyPriceLabel,
    yearlySaving: plan.yearlySavingLabel,
    period: plan.periodLabel,
    description: plan.upgradeDescription,
    icon: ui.icon,
    color: ui.color,
    borderClass: ui.borderClass,
    glowClass: ui.glowClass,
    buttonClass: ui.buttonClass,
    badge: plan.badge,
    features: plan.upgradeFeatures,
  };
});

async function redirectToCheckout(priceKey: PriceKey) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    toast.error("Please sign in first");
    return;
  }

  const { data, error } = await supabase.functions.invoke(
    "create-checkout-session",
    {
      body: {
        priceKey,
        successUrl: `${window.location.origin}/app/upgrade?success=true`,
        cancelUrl: `${window.location.origin}/app/upgrade?cancelled=true`,
      },
    },
  );

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const errorBody = await error.context.json();
      console.error("create-checkout-session HTTP error body:", errorBody);
      toast.error(errorBody?.error ?? "Checkout failed");
      return;
    }

    if (error instanceof FunctionsRelayError) {
      console.error("create-checkout-session relay error:", error.message);
      toast.error(error.message || "Relay error");
      return;
    }

    if (error instanceof FunctionsFetchError) {
      console.error("create-checkout-session fetch error:", error.message);
      toast.error(error.message || "Network error");
      return;
    }

    console.error("create-checkout-session unknown error:", error);
    toast.error("Could not start checkout");
    return;
  }

  if (data?.url) {
    window.location.href = data.url;
    return;
  }

  toast.error(data?.error ?? "Could not start checkout");
}

async function redirectToPortal() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    toast.error("Please sign in first");
    return;
  }

  const { data, error } = await supabase.functions.invoke(
    "create-portal-session",
    {
      body: {
        returnUrl: `${window.location.origin}/app/upgrade`,
      },
    },
  );

  if (error) {
    console.error("create-portal-session error:", error);
    toast.error(error.message || "Could not open billing portal");
    return;
  }

  if (data?.url) {
    window.location.href = data.url;
    return;
  }

  toast.error(data?.error || "Could not open billing portal");
}

function PlanCard({
  plan,
  isCurrent,
  isYearly,
  currentTier,
}: {
  plan: Plan;
  isCurrent: boolean;
  isYearly: boolean;
  currentTier: Tier;
}) {
  const [loading, setLoading] = useState(false);
  const isPreviewOnly = STRIPE_DISABLED && plan.id !== "free" && !isCurrent;

  const displayPrice =
    plan.id === "free"
      ? plan.monthlyPrice
      : isYearly
        ? plan.yearlyPrice
        : plan.monthlyPrice;

  const priceKey: PriceKey | null =
    plan.id === "free"
      ? null
      : isYearly
        ? PRICE_KEYS[plan.id as "pro" | "pro_max"].yearly
        : PRICE_KEYS[plan.id as "pro" | "pro_max"].monthly;

  async function handleUpgrade() {
    if (!priceKey) return;

    capture("upgrade_clicked", {
      plan: plan.id,
      plan_id: plan.id,
      billing_interval: isYearly ? "yearly" : "monthly",
      current_tier: currentTier,
      source: "upgrade_page_plan_card",
      route: window.location.pathname,
    });

    setLoading(true);
    try {
      await redirectToCheckout(priceKey);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-colors",
        plan.borderClass,
        !isPreviewOnly && plan.glowClass,
        isPreviewOnly && "border-white/10 bg-background/45 opacity-75 saturate-75",
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-5">
        <div
          className={cn(
            "mb-3 flex h-10 w-10 items-center justify-center rounded-xl border",
            isPreviewOnly ? "border-white/10 text-muted-foreground" : plan.borderClass,
            isPreviewOnly ? "bg-background/70" : plan.color,
          )}
        >
          {plan.icon}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={cn(
              "text-lg font-bold",
              isPreviewOnly ? "text-foreground/80" : plan.color,
            )}
          >
            {plan.name}
          </h3>
          {isCurrent && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TIER_BADGE[plan.id]}`}
            >
              Current
            </span>
          )}
          {isPreviewOnly && (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
              {PAID_PLANS_COMING_SOON_LABEL}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold">{displayPrice}</span>
          <span className="text-sm text-muted-foreground">
            /{plan.id === "free" ? plan.period : "mo"}
          </span>
        </div>

        <div className="mt-1 min-h-[24px]">
          {isYearly && plan.yearlySaving ? (
            <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              {plan.yearlySaving}
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
      </div>

      {isCurrent ? (
        <div className="mb-5 rounded-xl border border-dashed py-2.5 text-center text-sm text-muted-foreground">
          Your current plan
        </div>
      ) : plan.id === "free" ? (
        <div className="mb-5 rounded-xl border border-dashed py-2.5 text-center text-sm text-muted-foreground">
          Free forever
        </div>
      ) : STRIPE_DISABLED ? (
        <div className="mb-5 space-y-1 rounded-xl border border-dashed border-amber-400/20 bg-amber-400/5 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">
              {PAID_PLANS_COMING_SOON_LABEL}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Preview the plan for now. Checkout will open later.
          </p>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          className={`mb-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${plan.buttonClass}`}
          onClick={handleUpgrade}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting…
            </>
          ) : (
            <>Upgrade to {plan.name}</>
          )}
        </button>
      )}

      <ul className="space-y-2.5">
        {plan.features.map((f, i) => (
          <li
            key={i}
            className={`flex items-start gap-2.5 text-sm ${f.included ? "" : "opacity-40"}`}
          >
            <span
              className={`mt-0.5 shrink-0 ${f.included ? plan.color : "text-muted-foreground"}`}
            >
              {f.included ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="block h-4 w-4 text-center leading-4">—</span>
              )}
            </span>
            <span className={f.included ? "" : "line-through"}>{f.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonTable({ currentTier }: { currentTier: Tier }) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-4 py-3 text-left font-semibold">Feature</th>
            {PLANS.map((p) => (
              <th key={p.id} className={`px-4 py-3 text-center font-semibold ${p.color}`}>
                {p.name}
                {currentTier === p.id && (
                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                    (you)
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SUBSCRIPTION_COMPARISON_ROWS.map((row, i) => (
            <tr
              key={i}
              className="border-b transition-colors hover:bg-muted/20 last:border-0"
            >
              <td className="px-4 py-3 text-muted-foreground">{row.feature}</td>
              {(["free", "pro", "pro_max"] as Tier[]).map((tierName) => {
                const val = row[tierName];
                return (
                  <td key={tierName} className="px-4 py-3 text-center">
                    {typeof val === "string" ? (
                      <span className="font-semibold">{val}</span>
                    ) : val ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UpgradePage() {
  const tier = useTier();
  const visibleCurrentTier: Tier = STRIPE_DISABLED ? "free" : tier;
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    capture("subscription_page_viewed", {
      current_tier: visibleCurrentTier,
      route: "/app/upgrade",
    });
  }, [visibleCurrentTier]);
  const [portalLoading, setPortalLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const success = params.get("success") === "true";
  const cancelled = params.get("cancelled") === "true";

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      await redirectToPortal();
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-6">
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          🎉 Payment successful! Your plan has been upgraded. It may take a moment
          to reflect.
        </div>
      )}

      {cancelled && (
        <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Checkout cancelled — no charges were made.
        </div>
      )}

      <div className="space-y-4">
        <Link
          to="/app"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Dashboard
        </Link>

        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300">
              Plans & pricing
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Pricing preview
          </h1>

          <p className="mx-auto max-w-md text-muted-foreground">
            The full beta is open right now. This page previews how paid plans
            may look later as Begyn grows.
          </p>

          {STRIPE_DISABLED && (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5">
              <Lock className="h-3 w-3 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">
                {PAID_PLANS_PREVIEW_MESSAGE}
              </span>
            </div>
          )}

          <div className="mx-auto grid max-w-md grid-cols-[auto,52px,auto] items-center justify-center gap-x-3 gap-y-2 pt-2">
            <span
              className={`text-sm font-medium ${
                !isYearly ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </span>

            <button
              type="button"
              onClick={() => setIsYearly((v) => !v)}
              className={`relative h-7 w-[52px] rounded-full transition-colors ${
                isYearly ? "bg-violet-600" : "bg-muted"
              }`}
              aria-pressed={isYearly}
              aria-label={`Billing mode: ${isYearly ? "yearly" : "monthly"}`}
            >
              <div
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  isYearly ? "translate-x-[25px]" : "translate-x-0.5"
                }`}
              />
            </button>

            <span
              className={`text-sm font-medium ${
                isYearly ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Yearly
            </span>

            <div className="col-span-3 h-5 text-center">
              <span
                className={cn(
                  "inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400 transition-opacity",
                  isYearly ? "opacity-100" : "opacity-0",
                )}
                aria-hidden={!isYearly}
              >
                ~2 months free
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={visibleCurrentTier === plan.id}
            isYearly={isYearly}
            currentTier={visibleCurrentTier}
          />
        ))}
      </div>

      {(visibleCurrentTier === "pro" || visibleCurrentTier === "pro_max") &&
        !STRIPE_DISABLED && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            {portalLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ExternalLink className="h-3.5 w-3.5" />
            )}
            Manage billing & invoices
          </button>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-center text-lg font-semibold">Full comparison</h2>
        <ComparisonTable currentTier={visibleCurrentTier} />
      </div>

      <div className="space-y-4">
        <h2 className="text-center text-lg font-semibold">FAQ</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes — cancel anytime with no questions asked. You'll keep Pro access until the end of your billing period.",
            },
            {
              q: "What counts as an AI credit?",
              a: "Goal generation uses 3 credits, goal improvement uses 2, coach suggestions use 1, and weekly reports use 4.",
            },
            {
              q: "What happens when I hit my limit?",
              a: "AI features show a friendly message. All non-AI features continue working normally — nothing else is restricted.",
            },
            {
              q: "Will my data be used to train AI?",
              a: "No. Your personal data is never used to train AI models. It's only used to personalise suggestions within your own session.",
            },
          ].map((item, i) => (
            <div key={i} className="space-y-1.5 rounded-xl border bg-card p-4">
              <div className="text-sm font-semibold">{item.q}</div>
              <div className="text-sm text-muted-foreground">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
