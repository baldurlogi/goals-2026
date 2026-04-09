import type { Tier } from "./useTierTypes";

export const PAID_PLANS_COMING_SOON = true;

export const PAID_PLANS_COMING_SOON_LABEL = "Coming soon";
export const PAID_PLANS_PREVIEW_MESSAGE =
  "Paid plans are not available to purchase yet, but you can preview what they unlock.";

export const BETA_ACCESS_SUMMARY =
  "During the current beta, all users receive 1,000 AI credits per month and access to all live features while paid plans remain in preview.";

export const TIER_LABELS: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  pro_max: "Pro Max",
};

export const TIER_COLORS: Record<Tier, string> = {
  free: "text-muted-foreground",
  pro: "text-violet-400",
  pro_max: "text-amber-400",
};

export const TIER_BADGE: Record<Tier, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
  pro_max: "bg-amber-400/15 text-amber-400 border border-amber-400/30",
};

export type PlanFeature = {
  text: string;
  included: boolean;
};

export type SubscriptionPlanDefinition = {
  id: Tier;
  label: string;
  monthlyPriceLabel: string;
  yearlyPriceLabel: string;
  monthlyPriceValue: number;
  yearlyPriceValue: number;
  yearlySavingLabel: string;
  periodLabel: string;
  landingSub: string;
  upgradeDescription: string;
  landingFeatured: boolean;
  landingCta: string;
  badge?: string;
  creditsPerMonth: number;
  termSummary: string;
  landingPoints: string[];
  upgradeFeatures: PlanFeature[];
};

export const SUBSCRIPTION_PLAN_DEFINITIONS: Record<
  Tier,
  SubscriptionPlanDefinition
> = {
  free: {
    id: "free",
    label: "Free",
    monthlyPriceLabel: "€0",
    yearlyPriceLabel: "€0",
    monthlyPriceValue: 0,
    yearlyPriceValue: 0,
    yearlySavingLabel: "",
    periodLabel: "forever",
    landingSub: "Start tracking your life and build momentum",
    upgradeDescription: "Everything you need to start tracking your life.",
    landingFeatured: false,
    landingCta: "Start free",
    creditsPerMonth: 10,
    termSummary: "10 AI credits per month, all core tracking features",
    landingPoints: [
      "Core life dashboard",
      "Manual goals and tracking",
      "Basic progress visibility",
      "10 AI credits / month",
    ],
    upgradeFeatures: [
      {
        text: "All life modules (goals, fitness, nutrition, reading, todos, schedule)",
        included: true,
      },
      { text: "Progress visualization", included: true },
      { text: "Achievements & badges", included: true },
      { text: "PWA — install on any device", included: true },
      { text: "10 AI credits per month", included: true },
      { text: "AI Coach Card on dashboard", included: false },
      { text: "AI goal optimization", included: false },
      { text: "AI Weekly Life Report", included: false },
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    monthlyPriceLabel: "€9",
    yearlyPriceLabel: "€7.50",
    monthlyPriceValue: 9,
    yearlyPriceValue: 89,
    yearlySavingLabel: "Save €18/yr",
    periodLabel: "per month",
    landingSub: "Turn big goals into daily progress with more AI guidance",
    upgradeDescription: "Unlock AI coaching to hit your goals faster.",
    landingFeatured: true,
    landingCta: PAID_PLANS_COMING_SOON_LABEL,
    badge: "Most popular",
    creditsPerMonth: 200,
    termSummary: "200 AI credits per month, AI Weekly Report, AI Goal Optimisation",
    landingPoints: [
      "Everything in Free",
      "200 AI credits / month",
      "AI goal generation",
      "AI goal breakdown and suggestions",
      "Personalized AI guidance",
      "More clarity, less overwhelm",
    ],
    upgradeFeatures: [
      { text: "Everything in Free", included: true },
      { text: "200 AI credits per month", included: true },
      { text: "AI Coach Card — daily smart suggestions", included: true },
      { text: "AI goal optimization (Improve with AI)", included: true },
      { text: "AI Weekly Life Report", included: true },
      { text: "Priority support", included: true },
      { text: "1,000 AI credits per month", included: false },
    ],
  },
  pro_max: {
    id: "pro_max",
    label: "Pro Max",
    monthlyPriceLabel: "€19",
    yearlyPriceLabel: "€15.75",
    monthlyPriceValue: 19,
    yearlyPriceValue: 189,
    yearlySavingLabel: "Save €39/yr",
    periodLabel: "per month",
    landingSub: "Maximum AI power for serious goal achievers",
    upgradeDescription: "Maximum AI power for serious goal achievers.",
    landingFeatured: false,
    landingCta: PAID_PLANS_COMING_SOON_LABEL,
    creditsPerMonth: 1000,
    termSummary: "1,000 AI credits per month, all Pro features",
    landingPoints: [
      "Everything in Pro",
      "1,000 AI credits / month",
      "Early access to new AI features",
      "Priority support",
    ],
    upgradeFeatures: [
      { text: "Everything in Pro", included: true },
      { text: "1,000 AI credits per month", included: true },
      { text: "Early access to new AI features", included: true },
      { text: "Priority support", included: true },
    ],
  },
};

export const SUBSCRIPTION_COMPARISON_ROWS = [
  { feature: "Life modules", free: true, pro: true, pro_max: true },
  { feature: "Progress visualization", free: true, pro: true, pro_max: true },
  { feature: "Achievements", free: true, pro: true, pro_max: true },
  { feature: "AI credits / month", free: "10", pro: "200", pro_max: "1000" },
  { feature: "AI Coach Card", free: false, pro: true, pro_max: true },
  { feature: "AI goal optimization", free: false, pro: true, pro_max: true },
  { feature: "AI Weekly Report", free: false, pro: true, pro_max: true },
] as const;
