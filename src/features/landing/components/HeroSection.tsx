import { Button } from "@/components/ui/button";
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
      className="relative overflow-hidden px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8"
      style={{ background: t.bg }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ background: t.heroGlow }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="flex min-h-[360px] flex-col justify-center sm:min-h-[460px]">
          <h1
            className="mb-4 text-[clamp(38px,9vw,80px)] leading-[0.98] tracking-[-0.04em]"
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
          </h1>

          <p
            className="mb-7 max-w-2xl text-[15px] leading-7 sm:mb-8 sm:text-[clamp(16px,2vw,19px)] sm:leading-8"
            style={{ color: t.muted }}
          >
            Begyn turns your goals, habits, health, and routines into one clear
            daily system, so you always know what matters today and can keep
            moving without relying on motivation.
          </p>

          <div className="mb-4 flex min-h-[64px] flex-wrap gap-3">
            <Button
              type="button"
              onClick={onGetStarted}
              className="rounded-xl px-5 py-6 text-sm font-semibold"
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
              className="rounded-xl border px-5 py-6 text-sm font-semibold"
              style={{
                background: "transparent",
                borderColor: t.borderStrong,
                color: t.textSoft,
              }}
            >
              See how it works
            </Button>
          </div>
        </div>

        <div className="lg:pl-4">
          <div className="mx-auto max-w-[640px] lg:max-w-none">
            <div className="lg:hidden">
              <HeroProductPreview theme={theme} compact />
            </div>

            <div className="hidden lg:block">
              <HeroProductPreview theme={theme} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
