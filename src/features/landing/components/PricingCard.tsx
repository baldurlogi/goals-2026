import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { m } from "framer-motion";
import { TOKENS } from "../theme/tokens";
import type { BillingMode, PricingPlan, ThemeMode } from "../types";
import { PAID_PLANS_COMING_SOON_LABEL } from "@/features/subscription/subscriptionConfig";
import { fadeUp, landingViewport } from "../motion";

type PricingCardProps = PricingPlan & {
  theme: ThemeMode;
  billing: BillingMode;
  onChoosePlan: () => void;
  index: number;
};

function formatMonthlyEquivalent(yearly: number) {
  return (yearly / 12).toFixed(2);
}

export function PricingCard({
  theme,
  billing,
  onChoosePlan,
  name,
  sub,
  monthly,
  yearly,
  featured,
  cta,
  points,
  comingSoon,
  index,
}: PricingCardProps) {
  const t = TOKENS[theme];
  const isFree = monthly === 0;
  const isYearly = billing === "yearly";
  const displayPrice = isYearly ? yearly : monthly;
  const equivalentMonthly = !isFree ? formatMonthlyEquivalent(yearly) : null;
  const isPreviewOnly = Boolean(comingSoon);

  return (
    <m.div
      className="h-full"
      initial="hidden"
      whileInView="visible"
      viewport={landingViewport}
      variants={fadeUp(24, index * 0.08)}
    >
      <Card
        className="relative h-full overflow-hidden rounded-3xl"
        style={{
          background: isPreviewOnly
            ? t.surface2
            : featured
              ? t.primarySoft
              : t.surface,
          border: `1px solid ${isPreviewOnly ? t.border : featured ? t.primaryBorder : t.border}`,
          boxShadow: isPreviewOnly ? "none" : featured ? t.shadow : "none",
          opacity: isPreviewOnly ? 0.82 : 1,
          filter: isPreviewOnly ? "saturate(0.82)" : undefined,
        }}
      >
        <CardContent className="flex h-full min-h-0 flex-col p-5 sm:min-h-[560px] sm:p-6">
          {featured && (
            <div
              className="absolute right-4 top-4 rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.08em]"
              style={{
                background: t.primarySoft,
                border: `1px solid ${t.primaryBorder}`,
                color: t.primary,
              }}
            >
              MOST POPULAR
            </div>
          )}
          {isPreviewOnly && (
            <div
              className="absolute left-4 top-4 rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.08em]"
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                color: t.primary,
              }}
            >
              {PAID_PLANS_COMING_SOON_LABEL.toUpperCase()}
            </div>
          )}

          <div className="mb-1 text-xl font-bold" style={{ color: t.text }}>
            {name}
          </div>

          <div
            className="mb-4 min-h-0 text-sm leading-6 sm:mb-5 sm:min-h-[48px]"
            style={{ color: t.muted }}
          >
            {sub}
          </div>

          <div className="mb-4 min-h-0 sm:min-h-[108px]">
            <div className="mb-2 flex min-h-0 items-end gap-1.5 sm:min-h-[52px]">
              <div
                className="min-w-[92px] text-[38px] leading-none sm:min-w-[110px] sm:text-[42px]"
                style={{
                  color: t.text,
                  fontFamily: "'Instrument Serif', serif",
                }}
              >
                ${displayPrice}
              </div>

              {!isFree && (
                <div className="mb-1 text-sm" style={{ color: t.faint }}>
                  /{isYearly ? "yr" : "mo"}
                </div>
              )}
            </div>

            <div className="min-h-0 sm:min-h-[52px]">
              {isFree ? (
                <div className="text-xs" style={{ color: t.primary }}>
                  No credit card required
                </div>
              ) : isYearly ? (
                <div className="space-y-1.5">
                  <div className="flex min-h-[20px] items-center gap-2 text-sm">
                    <span className="line-through" style={{ color: t.faint }}>
                      ${monthly}/mo
                    </span>
                    <span className="font-semibold" style={{ color: t.primary }}>
                      ${equivalentMonthly}/mo equivalent
                    </span>
                  </div>

                  <div className="text-xs" style={{ color: t.primary }}>
                    Billed once yearly · save 17%
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div
                    className="min-h-[20px] text-sm"
                    style={{ visibility: "hidden" }}
                  >
                    ${monthly}/mo equivalent
                  </div>

                  <div className="text-xs" style={{ color: t.primary }}>
                    or ${yearly}/year · billed once yearly · save 17%
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 grid min-h-0 gap-2.5 sm:min-h-[190px]">
            {points.map((point) => (
              <div key={point} className="flex items-start gap-2.5">
                <span style={{ color: t.primary }}>●</span>
                <span className="text-sm leading-6" style={{ color: t.textSoft }}>
                  {point}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto">
            <Button
              type="button"
              onClick={isPreviewOnly ? undefined : onChoosePlan}
              disabled={isPreviewOnly}
              className="w-full rounded-xl font-semibold"
              style={{
                background: isPreviewOnly ? t.surface : featured ? t.primary : t.text,
                color: isPreviewOnly ? t.faint : featured ? "#052e16" : t.bg,
                border: isPreviewOnly ? `1px solid ${t.border}` : undefined,
              }}
            >
              {cta}
            </Button>
            {isPreviewOnly && (
              <p className="mt-3 text-center text-xs" style={{ color: t.faint }}>
                Preview what Pro includes. Checkout opens later.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}
