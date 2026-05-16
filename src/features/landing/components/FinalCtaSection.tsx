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
    <section className="relative overflow-hidden px-3 pb-24 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
      <m.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.6 }}
        viewport={landingViewport}
        transition={{ duration: 0.7, ease: landingEase }}
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(circle at 50% 22%, rgba(74,222,128,0.18), transparent 30%), radial-gradient(circle at 50% 68%, rgba(96,165,250,0.08), transparent 36%)"
              : t.heroGlow,
          opacity: 0.6,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${t.primaryBorder}, transparent)`,
        }}
      />

      <m.div
        className="relative mx-auto max-w-5xl rounded-[38px] px-3 py-10 sm:px-8 sm:py-14"
        initial="hidden"
        whileInView="visible"
        viewport={landingViewport}
        variants={staggerContainer(0.1)}
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(180deg, rgba(255,255,255,0.028), rgba(255,255,255,0.008))"
              : "rgba(255,255,255,0.7)",
          boxShadow: `inset 0 0 0 1px ${t.border}`,
        }}
      >
        <m.div
          className="mx-auto mb-5 h-1 w-20 rounded-full"
          variants={fadeUp(12)}
          style={{
            background: `linear-gradient(90deg, transparent, ${t.primary}, transparent)`,
          }}
        />
        <m.h2
          className="mx-auto mb-5 max-w-[13ch] text-[clamp(38px,6vw,72px)] leading-[0.96] tracking-[-0.04em]"
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
          className="mx-auto mb-9 max-w-2xl text-sm leading-7 sm:text-[15px] sm:leading-8"
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
            className="min-h-12 rounded-full px-7 py-3.5 text-sm font-semibold shadow-[0_18px_54px_rgba(74,222,128,0.20)] sm:py-6"
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
              className="min-h-12 rounded-full px-7 py-3.5 text-sm font-semibold sm:py-6"
              style={{
                background: "rgba(255,255,255,0.045)",
                borderColor: "transparent",
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
