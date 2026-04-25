import type { PricingPlan } from "../types";
import { SUBSCRIPTION_PLAN_DEFINITIONS } from "@/features/subscription/subscriptionConfig";

export const PRICING_PLANS: PricingPlan[] = [
  SUBSCRIPTION_PLAN_DEFINITIONS.free,
  SUBSCRIPTION_PLAN_DEFINITIONS.pro,
].map((plan) => ({
  id: plan.id,
  name: plan.label,
  sub: plan.landingSub,
  monthly: plan.monthlyPriceValue,
  yearly: plan.yearlyPriceValue,
  featured: plan.landingFeatured,
  cta: plan.landingCta,
  points: plan.landingPoints,
  comingSoon: plan.id !== "free",
}));
