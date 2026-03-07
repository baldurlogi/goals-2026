import { Button } from "@/components/ui/button";
import { PERSONA_PILLS } from "../data/personas";
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
      className="relative flex min-h-screen items-center px-4 pb-20 pt-28 sm:px-6 lg:px-8"
      style={{ background: t.bg }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: t.heroGlow }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div>
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2"
            style={{
              background: t.primarySoft,
              borderColor: t.primaryBorder,
              color: t.primary,
            }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: t.primary }}
            />
            <span className="font-mono text-[11px] tracking-[0.08em]">
              AI LIFE SYSTEM
            </span>
          </div>

          <h1
            className="mb-5 text-[clamp(42px,8vw,80px)] leading-[0.98] tracking-[-0.04em]"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              color: t.text,
            }}
          >
            Turn your life goals
            <br />
            <em style={{ color: t.primary, fontStyle: "italic" }}>
              into daily progress.
            </em>
          </h1>

          <p
            className="mb-3 max-w-2xl text-[clamp(16px,2vw,19px)] leading-8"
            style={{ color: t.muted }}
          >
            Break big ambitions into clear daily steps with an AI-powered life
            dashboard.
          </p>

          <p
            className="mb-7 max-w-2xl text-sm leading-8 sm:text-[15px]"
            style={{ color: t.faint }}
          >
            Goals, habits, fitness, learning and finances — all connected so you
            can see your real progress and always know what to do next.
          </p>

          <div className="mb-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={onGetStarted}
              className="rounded-xl px-5 py-6 text-sm font-semibold"
              style={{
                background: t.primary,
                color: theme === "dark" ? "#052e16" : "#ffffff",
              }}
            >
              Start for free →
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

          <div className="flex flex-wrap gap-2.5">
            {PERSONA_PILLS.map((label) => (
              <div
                key={label}
                className="rounded-full border px-3.5 py-2 text-xs sm:text-[12.5px]"
                style={{
                  background: t.surface3,
                  borderColor: t.border,
                  color: t.muted,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:pl-4">
          <HeroProductPreview theme={theme} />
        </div>
      </div>
    </section>
  );
}