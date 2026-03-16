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
      "10 AI prompts / month",
    ],
  },
  {
    name: "Pro",
    sub: "Turn big goals into daily progress with more AI guidance",
    monthly: 9,
    yearly: 89,
    featured: true,
    cta: "Get Pro",
    points: [
      "Everything in Free",
      "200 AI prompts / month",
      "AI goal generation",
      "AI goal breakdown and suggestions",
      "Personalized AI guidance",
      "More clarity, less overwhelm",
    ],
  },
];