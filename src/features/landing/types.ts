export type ThemeMode = "dark" | "light";
export type BillingMode = "monthly" | "yearly";

export type AccentKey = "primary" | "blue" | "amber" | "purple" | "rose";

export type ThemeTokens = {
  bg: string;
  bgSoft: string;
  surface: string;
  surface2: string;
  surface3: string;
  text: string;
  textSoft: string;
  muted: string;
  faint: string;
  faint2: string;
  border: string;
  borderStrong: string;
  primary: string;
  primarySoft: string;
  primaryBorder: string;
  blue: string;
  amber: string;
  purple: string;
  rose: string;
  shadow: string;
  heroGlow: string;
};

export type ThemeTokenMap = Record<ThemeMode, ThemeTokens>;

export type FeatureCardItem = {
  icon: string;
  title: string;
  body: string;
  accent: AccentKey;
};

export type HowItWorksItem = {
  step: string;
  title: string;
  body: string;
};

export type PersonaPillItem = string;

export type DifferenceItem = {
  title: string;
  body: string;
};

export type PricingPlan = {
  name: string;
  sub: string;
  monthly: number;
  yearly: number;
  featured: boolean;
  cta: string;
  points: string[];
  comingSoon?: boolean;
};
