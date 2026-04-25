import { Button } from "@/components/ui/button";
import { m } from "framer-motion";
import { fadeUp, landingEase, staggerContainer } from "../motion";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";
import { HeroProductPreview } from "./HeroProductPreview";

type HeroSectionProps = {
  theme: ThemeMode;
  onGetStarted: () => void;
  onSeeHowItWorks: () => void;
};

export function HeroSection({
  theme,
  onGetStarted,
  onSeeHowItWorks,
}: HeroSectionProps) {
  const t = TOKENS[theme];

  return (
    <section
      className="relative overflow-hidden px-4 pb-12 pt-20 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8"
      style={{ background: t.bg }}
    >
      <m.div
        className="pointer-events-none absolute inset-0 opacity-80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 0.9, ease: landingEase }}
        style={{ background: t.heroGlow }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-2 lg:items-center lg:gap-14">
        <m.div
          className="flex min-h-0 flex-col justify-center sm:min-h-[460px]"
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.12, 0.05)}
        >
          <m.h1
            className="mb-4 max-w-[11ch] text-[clamp(34px,10vw,80px)] leading-[0.98] tracking-[-0.04em] sm:max-w-none"
            variants={fadeUp(24)}
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              color: t.text,
            }}
          >
            Stop drifting away from the life
            <br />
            <em style={{ color: t.primary, fontStyle: "italic" }}>
              you want to live.
            </em>
          </m.h1>

          <m.p
            className="mb-6 max-w-xl text-sm leading-6 sm:mb-8 sm:max-w-2xl sm:text-[clamp(16px,2vw,19px)] sm:leading-8"
            variants={fadeUp(18)}
            style={{ color: t.muted }}
          >
            Begyn turns your goals, habits, health, and routines into one clear
            daily system, so you always know what matters today and can keep
            moving without relying on motivation.
          </m.p>

          <m.div
            className="mb-4 flex flex-col gap-3 sm:min-h-[64px] sm:flex-row sm:flex-wrap"
            variants={fadeUp(16)}
          >
            <Button
              type="button"
              onClick={onGetStarted}
              className="min-h-12 w-full rounded-xl px-5 py-3.5 text-sm font-semibold sm:w-auto sm:py-6"
              style={{
                background: t.primary,
                color: theme === "dark" ? "#052e16" : "#ffffff",
              }}
            >
              Start free →
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onSeeHowItWorks}
              className="min-h-12 w-full rounded-xl border px-5 py-3.5 text-sm font-semibold sm:w-auto sm:py-6"
              style={{
                background: "transparent",
                borderColor: t.borderStrong,
                color: t.textSoft,
              }}
            >
              See how it works
            </Button>
          </m.div>
        </m.div>

        <m.div
          className="lg:pl-4"
          initial={{ opacity: 0, x: 32, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          transition={{ duration: 0.78, delay: 0.18, ease: landingEase }}
        >
          <div className="mx-auto max-w-[640px] lg:max-w-none">
            <div className="lg:hidden">
              <HeroProductPreview theme={theme} compact />
            </div>

            <div className="hidden lg:block">
              <HeroProductPreview theme={theme} />
            </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}
