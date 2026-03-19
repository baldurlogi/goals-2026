import { PRICING_PLANS } from "../data/pricing";
import { useReveal } from "../hooks/useReveal";
import { TOKENS } from "../theme/tokens";
import type { BillingMode, ThemeMode } from "../types";
import { BillingToggle } from "./BillingToggle";
import { PricingCard } from "./PricingCard";

type PricingSectionProps = {
  theme: ThemeMode;
  billing: BillingMode;
  setBilling: (billing: BillingMode) => void;
  onChoosePlan: () => void;
};

export function PricingSection({
  theme,
  billing,
  setBilling,
  onChoosePlan,
}: PricingSectionProps) {
  const t = TOKENS[theme];
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section
      id="pricing"
      className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
    >
      <div
        ref={ref}
        style={{
          textAlign: "center",
          marginBottom: 44,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.55s ease, transform 0.55s ease",
        }}
      >
        <div
          className="mb-4 font-mono text-[11px] tracking-[0.12em]"
          style={{ color: t.faint }}
        >
          PRICING
        </div>

        <h2
          className="mb-3 text-[clamp(30px,4vw,46px)] leading-[1.08] tracking-[-0.03em]"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            color: t.text,
          }}
        >
          Start free.
          <br />
          <em style={{ color: t.primary }}>
            Upgrade when you want more support staying consistent.
          </em>
        </h2>

        <p
          className="mx-auto mb-6 max-w-2xl text-sm leading-8 sm:text-[15px]"
          style={{ color: t.faint }}
        >
          Use the core system for free, or unlock more AI prompts, stronger
          planning, and better day-to-day guidance when you want extra help
          following through.
        </p>

        <BillingToggle
          billing={billing}
          setBilling={setBilling}
          theme={theme}
        />

        <div
          className="mx-auto mt-3 min-h-[20px] text-xs"
          style={{ color: t.primary }}
        >
          {billing === "yearly" ? (
            "Yearly is billed once upfront."
          ) : (
            <span style={{ visibility: "hidden" }}>
              Yearly is billed once upfront.
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
        {PRICING_PLANS.map((plan) => (
          <PricingCard
            key={plan.name}
            theme={theme}
            billing={billing}
            onChoosePlan={onChoosePlan}
            {...plan}
          />
        ))}
      </div>

      <div
        className="mx-auto mt-6 max-w-3xl text-center text-sm"
        style={{ color: t.faint }}
      >
        Pro Max is coming soon. Right now, we make focus on making your goal journey the easiest it can be.
      </div>
    </section>
  );
}