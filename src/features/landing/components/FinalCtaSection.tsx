import { Button } from "@/components/ui/button";
import { m } from "framer-motion";
import { fadeUp, landingEase, landingViewport, staggerContainer } from "../motion";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";

type FinalCtaSectionProps = {
  theme: ThemeMode;
  onGetStarted: () => void;
  onSeePricing?: () => void;
};

export function FinalCtaSection({
  theme,
  onGetStarted,
  onSeePricing,
}: FinalCtaSectionProps) {
  const t = TOKENS[theme];

  return (
    <section className="relative px-4 pb-24 pt-20 text-center sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
      <m.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.6 }}
        viewport={landingViewport}
        transition={{ duration: 0.7, ease: landingEase }}
        style={{
          background: t.heroGlow,
          opacity: 0.6,
        }}
      />

      <m.div
        className="relative mx-auto max-w-4xl"
        initial="hidden"
        whileInView="visible"
        viewport={landingViewport}
        variants={staggerContainer(0.1)}
      >
        <m.h2
          className="mb-4 text-[clamp(34px,5vw,58px)] leading-[1.05] tracking-[-0.04em]"
          variants={fadeUp(22)}
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            color: t.text,
          }}
        >
          Start now,
          <br />
          <em style={{ color: t.primary }}>
            so future you has something to thank you for.
          </em>
        </m.h2>

        <m.p
          className="mx-auto mb-8 max-w-2xl text-sm leading-7 sm:text-[15px] sm:leading-8"
          variants={fadeUp(16)}
          style={{ color: t.faint }}
        >
          Track your goals, habits, health, and daily progress in one place — and
          turn “I should” into visible follow-through.
        </m.p>

        <m.div
          className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          variants={fadeUp(14)}
        >
          <Button
            type="button"
            onClick={onGetStarted}
            className="min-h-12 rounded-xl px-6 py-3.5 text-sm font-semibold sm:py-6"
            style={{
              background: t.primary,
              color: theme === "dark" ? "#052e16" : "#ffffff",
            }}
          >
            Start free →
          </Button>

          {onSeePricing && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSeePricing}
              className="min-h-12 rounded-xl border px-6 py-3.5 text-sm font-semibold sm:py-6"
              style={{
                background: "transparent",
                borderColor: t.borderStrong,
                color: t.textSoft,
              }}
            >
              See pricing
            </Button>
          )}
        </m.div>
      </m.div>
    </section>
  );
}
