import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TOKENS } from "../theme/tokens";
import type { BillingMode, PricingPlan, ThemeMode } from "../types";

type PricingCardProps = PricingPlan & {
  theme: ThemeMode;
  billing: BillingMode;
  onChoosePlan: () => void;
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
}: PricingCardProps) {
  const t = TOKENS[theme];
  const isFree = monthly === 0;
  const isYearly = billing === "yearly";
  const displayPrice = isYearly ? yearly : monthly;
  const equivalentMonthly = !isFree ? formatMonthlyEquivalent(yearly) : null;

  return (
    <Card
      className="relative h-full overflow-hidden rounded-3xl"
      style={{
        background: featured ? t.primarySoft : t.surface,
        border: `1px solid ${featured ? t.primaryBorder : t.border}`,
        boxShadow: featured ? t.shadow : "none",
      }}
    >
      <CardContent className="flex h-full flex-col p-6">
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

        <div className="mb-1 text-xl font-bold" style={{ color: t.text }}>
          {name}
        </div>

        <div className="mb-5 text-sm leading-6" style={{ color: t.muted }}>
          {sub}
        </div>

        <div className="mb-2 flex items-end gap-1.5">
          <div
            className="text-[42px] leading-none"
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

        <div className="mb-5 min-h-[52px]">
          {isFree ? (
            <div className="text-xs" style={{ color: t.primary }}>
              No credit card required
            </div>
          ) : isYearly ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="line-through"
                  style={{ color: t.faint }}
                >
                  ${monthly}/mo
                </span>
                <span
                  className="font-semibold"
                  style={{ color: t.primary }}
                >
                  ${equivalentMonthly}/mo equivalent
                </span>
              </div>

              <div className="text-xs" style={{ color: t.primary }}>
                Billed once yearly · save 17%
              </div>
            </div>
          ) : (
            <div className="text-xs" style={{ color: t.primary }}>
              or ${yearly}/year · billed once yearly · save 17%
            </div>
          )}
        </div>

        <div className="mb-6 grid gap-2.5">
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
            onClick={onChoosePlan}
            className="w-full rounded-xl font-semibold"
            style={{
              background: featured ? t.primary : t.text,
              color: featured ? "#052e16" : t.bg,
            }}
          >
            {cta}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}