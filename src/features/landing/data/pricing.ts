import type { PricingPlan } from "../types";

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    sub: "Start tracking your life and build momentum",
    monthly: 0,
    yearly: 0,
    featured: false,
    cta: "Start free",
    points: [
      "Core life dashboard",
      "Manual goals and tracking",
      "Basic progress visibility",
      "10 AI credits / month",
    ],
  },
  {
    name: "Pro",
    sub: "Turn big goals into daily progress with more AI guidance",
    monthly: 9,
    yearly: 89,
    featured: true,
    cta: "Coming soon",
    comingSoon: true,
    points: [
      "Everything in Free",
      "200 AI credits / month",
      "AI goal generation",
      "AI goal breakdown and suggestions",
      "Personalized AI guidance",
      "More clarity, less overwhelm",
    ],
  },
];
