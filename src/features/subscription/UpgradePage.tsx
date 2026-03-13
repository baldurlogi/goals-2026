/**
 * UpgradePage.tsx — /app/upgrade
 * STRIPE_DISABLED = true → "Coming soon" for real users
 * Set to false when ready to charge real money.
 * Test card: 4242 4242 4242 4242 — any future date, any CVC
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, Zap, Crown, ArrowLeft, Lock, Loader2, ExternalLink } from "lucide-react";
import { useTier, TIER_BADGE, type Tier } from "@/features/subscription/useTier";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from "@supabase/supabase-js";


const STRIPE_DISABLED = false;

const PRICE_KEYS = {
  pro:     { monthly: "pro_monthly",     yearly: "pro_yearly"     },
  pro_max: { monthly: "pro_max_monthly", yearly: "pro_max_yearly" },
} as const;

type PriceKey = "pro_monthly" | "pro_yearly" | "pro_max_monthly" | "pro_max_yearly";

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

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: "€0",
    yearlyPrice: "€0",
    yearlySaving: "",
    period: "forever",
    description: "Everything you need to start tracking your life.",
    icon: <Zap className="h-5 w-5" />,
    color: "text-muted-foreground",
    borderClass: "border-border",
    glowClass: "",
    buttonClass: "bg-muted text-muted-foreground cursor-default",
    features: [
      { text: "All life modules (goals, fitness, nutrition, reading, todos, schedule)", included: true },
      { text: "Progress visualization", included: true },
      { text: "Achievements & badges", included: true },
      { text: "PWA — install on any device", included: true },
      { text: "10 AI prompts per month", included: true },
      { text: "AI Coach Card on dashboard", included: false },
      { text: "AI goal optimization", included: false },
      { text: "AI Weekly Life Report", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: "€9",
    yearlyPrice: "€7.50",
    yearlySaving: "Save €18/yr",
    period: "per month",
    description: "Unlock AI coaching to hit your goals faster.",
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-violet-400",
    borderClass: "border-violet-500/50",
    glowClass: "shadow-[0_0_24px_2px_rgba(139,92,246,0.15)]",
    buttonClass: "bg-violet-600 text-white hover:bg-violet-500",
    badge: "Most popular",
    features: [
      { text: "Everything in Free", included: true },
      { text: "200 AI prompts per month", included: true },
      { text: "AI Coach Card — daily smart suggestions", included: true },
      { text: "AI goal optimization (Improve with AI)", included: true },
      { text: "AI Weekly Life Report", included: true },
      { text: "Priority support", included: true },
      { text: "1,000 AI prompts per month", included: false },
    ],
  },
  {
    id: "pro_max",
    name: "Pro Max",
    monthlyPrice: "€19",
    yearlyPrice: "€15.75",
    yearlySaving: "Save €39/yr",
    period: "per month",
    description: "Maximum AI power for serious goal achievers.",
    icon: <Crown className="h-5 w-5" />,
    color: "text-amber-400",
    borderClass: "border-amber-400/50",
    glowClass: "shadow-[0_0_24px_2px_rgba(251,191,36,0.15)]",
    buttonClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "1,000 AI prompts per month", included: true },
      { text: "Early access to new AI features", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

const COMPARISON_ROWS = [
  { feature: "Life modules",           free: true,  pro: true,  pro_max: true  },
  { feature: "Progress visualization", free: true,  pro: true,  pro_max: true  },
  { feature: "Achievements",           free: true,  pro: true,  pro_max: true  },
  { feature: "AI prompts / month",     free: "10",  pro: "200", pro_max: "1000"},
  { feature: "AI Coach Card",          free: false, pro: true,  pro_max: true  },
  { feature: "AI goal optimization",   free: false, pro: true,  pro_max: true  },
  { feature: "AI Weekly Report",       free: false, pro: true,  pro_max: true  },
];

async function redirectToCheckout(priceKey: PriceKey) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    toast.error("Please sign in first");
    return;
  }

  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: {
      priceKey,
      successUrl: `${window.location.origin}/app/upgrade?success=true`,
      cancelUrl: `${window.location.origin}/app/upgrade?cancelled=true`,
    },
  });

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
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    toast.error("Please sign in first");
    return;
  }

  const { data, error } = await supabase.functions.invoke("create-portal-session", {
    body: {
      returnUrl: `${window.location.origin}/app/upgrade`,
    },
  });

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

function PlanCard({ plan, isCurrent, isYearly }: { plan: Plan; isCurrent: boolean; isYearly: boolean }) {
  const [loading, setLoading] = useState(false);

  const displayPrice = plan.id === "free" ? plan.monthlyPrice
    : isYearly ? plan.yearlyPrice : plan.monthlyPrice;

  const priceKey: PriceKey | null = plan.id === "free" ? null
    : isYearly
      ? PRICE_KEYS[plan.id as "pro" | "pro_max"].yearly
      : PRICE_KEYS[plan.id as "pro" | "pro_max"].monthly;

  async function handleUpgrade() {
    if (!priceKey) return;
    setLoading(true);
    try { await redirectToCheckout(priceKey); }
    finally { setLoading(false); }
  }

  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 ${plan.borderClass} ${plan.glowClass}`}>
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
            {plan.badge}
          </span>
        </div>
      )}
      <div className="mb-5">
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${plan.borderClass} ${plan.color}`}>
          {plan.icon}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`text-lg font-bold ${plan.color}`}>{plan.name}</h3>
          {isCurrent && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TIER_BADGE[plan.id]}`}>
              Current
            </span>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold">{displayPrice}</span>
          <span className="text-sm text-muted-foreground">/{plan.id === "free" ? plan.period : "mo"}</span>
        </div>
        {isYearly && plan.yearlySaving && (
          <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            {plan.yearlySaving}
          </span>
        )}
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
        <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-dashed py-2.5">
          <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-sm text-muted-foreground">Coming soon</span>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          className={`mb-5 w-full rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${plan.buttonClass}`}
          onClick={handleUpgrade}
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</> : <>Upgrade to {plan.name}</>}
        </button>
      )}

      <ul className="space-y-2.5">
        {plan.features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2.5 text-sm ${f.included ? "" : "opacity-40"}`}>
            <span className={`mt-0.5 shrink-0 ${f.included ? plan.color : "text-muted-foreground"}`}>
              {f.included ? <Check className="h-4 w-4" /> : <span className="block h-4 w-4 text-center leading-4">—</span>}
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
            {PLANS.map(p => (
              <th key={p.id} className={`px-4 py-3 text-center font-semibold ${p.color}`}>
                {p.name}
                {currentTier === p.id && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(you)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-muted-foreground">{row.feature}</td>
              {(["free", "pro", "pro_max"] as Tier[]).map(tier => {
                const val = row[tier];
                return (
                  <td key={tier} className="px-4 py-3 text-center">
                    {typeof val === "string" ? <span className="font-semibold">{val}</span>
                      : val ? <Check className="mx-auto h-4 w-4 text-emerald-500" />
                      : <span className="text-muted-foreground/40">—</span>}
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
  const [isYearly, setIsYearly] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const params    = new URLSearchParams(window.location.search);
  const success   = params.get("success") === "true";
  const cancelled = params.get("cancelled") === "true";

  async function handleManageBilling() {
    setPortalLoading(true);
    try { await redirectToPortal(); }
    finally { setPortalLoading(false); }
  }

  return ( 
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-6">
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          🎉 Payment successful! Your plan has been upgraded. It may take a moment to reflect.
        </div>
      )}
      {cancelled && (
        <div className="rounded-xl border border-muted bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Checkout cancelled — no charges were made.
        </div>
      )}

      <div className="space-y-4">
        <Link to="/app" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Dashboard
        </Link>
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300">Upgrade Kairo</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Unlock your full potential</h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            Add AI coaching to every part of your life — from daily suggestions to goal optimization and weekly insights.
          </p>
          {STRIPE_DISABLED && (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5">
              <Lock className="h-3 w-3 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">Payments coming soon — plans shown for preview only</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <button
              type="button"
              onClick={() => setIsYearly(v => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${isYearly ? "bg-violet-600" : "bg-muted"}`}
            >
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isYearly ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>Yearly</span>
            {isYearly && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">~2 months free</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} isCurrent={tier === plan.id} isYearly={isYearly} />)}
      </div>

      {(tier === "pro" || tier === "pro_max") && !STRIPE_DISABLED && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            Manage billing & invoices
          </button>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-center text-lg font-semibold">Full comparison</h2>
        <ComparisonTable currentTier={tier} />
      </div>

      <div className="space-y-4">
        <h2 className="text-center text-lg font-semibold">FAQ</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { q: "Can I cancel anytime?", a: "Yes — cancel anytime with no questions asked. You'll keep Pro access until the end of your billing period." },
            { q: "What counts as an AI prompt?", a: "Each AI action uses one prompt: generating a goal, getting a coach suggestion, improving a goal plan, or receiving a weekly report." },
            { q: "What happens when I hit my limit?", a: "AI features show a friendly message. All non-AI features continue working normally — nothing else is restricted." },
            { q: "Will my data be used to train AI?", a: "No. Your personal data is never used to train AI models. It's only used to personalise suggestions within your own session." },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-1.5">
              <div className="text-sm font-semibold">{item.q}</div>
              <div className="text-sm text-muted-foreground">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}