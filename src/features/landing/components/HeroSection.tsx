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
  onJoinWaitlist: () => void;
};

export function HeroSection({
  theme,
  onGetStarted,
  onSeeHowItWorks,
  onJoinWaitlist,
}: HeroSectionProps) {
  const t = TOKENS[theme];

  return (
    <section
      className="relative overflow-hidden px-3 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8"
    >
      <m.div
        className="pointer-events-none absolute inset-0 opacity-80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 0.9, ease: landingEase }}
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(circle at 62% 28%, rgba(74,222,128,0.15), transparent 30%), radial-gradient(circle at 78% 62%, rgba(96,165,250,0.10), transparent 34%), linear-gradient(180deg, rgba(6,11,20,0.2), rgba(6,11,20,0.95))"
              : t.heroGlow,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{ background: `linear-gradient(to bottom, transparent, ${t.bg})` }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10 xl:gap-16">
        <m.div
          className="flex min-h-0 flex-col items-center justify-center text-center sm:min-h-[460px] lg:items-start lg:text-left"
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.12, 0.05)}
        >
          <m.h1
            className="mb-5 max-w-[13ch] text-[clamp(38px,10vw,84px)] leading-[0.96] tracking-[-0.04em] sm:max-w-none"
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
            className="mb-7 max-w-xl text-sm leading-7 sm:mb-9 sm:max-w-2xl sm:text-[clamp(16px,2vw,19px)] sm:leading-8"
            variants={fadeUp(18)}
            style={{ color: t.muted }}
          >
            Begyn turns your goals, habits, health, and routines into one clear
            daily system, so you always know what matters today and can keep
            moving without relying on motivation.
          </m.p>

          <m.div
            className="mb-5 flex w-full flex-col gap-3 sm:min-h-[64px] sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start"
            variants={fadeUp(16)}
          >
            <Button
              type="button"
              onClick={onGetStarted}
              className="min-h-12 w-full rounded-full px-6 py-3.5 text-sm font-semibold shadow-[0_18px_48px_rgba(74,222,128,0.20)] sm:w-auto sm:py-6"
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
              onClick={onJoinWaitlist}
              className="min-h-12 w-full rounded-full border px-6 py-3.5 text-sm font-semibold sm:w-auto sm:py-6"
              style={{
                background: "transparent",
                borderColor: t.primaryBorder,
                color: t.primary,
              }}
            >
              Join Pro waitlist
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onSeeHowItWorks}
              className="min-h-12 w-full rounded-full px-6 py-3.5 text-sm font-semibold sm:w-auto sm:py-6"
              style={{
                background: "rgba(255,255,255,0.035)",
                borderColor: "transparent",
                color: t.textSoft,
              }}
            >
              See how it works
            </Button>
          </m.div>

          <m.p
            className="max-w-xl text-xs leading-6 sm:text-sm"
            variants={fadeUp(14)}
            style={{ color: t.faint }}
          >
            Pro launches soon. Join the waitlist if you want the launch email,
            or start free today.
          </m.p>
        </m.div>

        <m.div
          className="relative lg:pl-2"
          initial={{ opacity: 0, x: 32, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          transition={{ duration: 0.78, delay: 0.18, ease: landingEase }}
        >
          <div
            className="pointer-events-none absolute inset-[-12%] hidden rounded-full blur-3xl lg:block"
            style={{
              background:
                "radial-gradient(circle, rgba(74,222,128,0.13), transparent 58%)",
            }}
          />
          <div className="relative mx-auto max-w-[640px] lg:max-w-none">
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
