import type { PricingPlan } from "../types";

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    sub: "Get started and build momentum",
    monthly: 0,
    yearly: 0,
    featured: false,
    cta: "Start free",
    points: [
      "Core life dashboard",
      "Manual goals and tracking",
      "Basic progress visibility",
      "10 AI prompts / month",
    ],
  },
  {
    name: "Pro",
    sub: "For serious self-improvement",
    monthly: 9,
    yearly: 89,
    featured: true,
    cta: "Get Pro",
    points: [
      "Everything in Free",
      "200 AI prompts / month",
      "AI goal generation",
      "AI step breakdown",
      "AI suggestions",
      "Basic memory + personalization",
    ],
  },
  {
    name: "Pro Max",
    sub: "Your AI life coach",
    monthly: 19,
    yearly: 189,
    featured: false,
    cta: "Get Pro Max",
    points: [
      "Everything in Pro",
      "1000 AI prompts / month",
      "Persistent AI memory",
      "Weekly AI life reports",
      "Deep insights + personalization",
      "Advanced coaching + recommendations",
    ],
  },
];