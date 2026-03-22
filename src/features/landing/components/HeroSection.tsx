import { Button } from "@/components/ui/button";
import { PERSONA_PILLS } from "../data/personas";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";
import { HeroProductPreview } from "./HeroProductPreview";

type HeroSectionProps = {
  theme: ThemeMode;
  onGetStarted: () => void;
  onLogIn: () => void;
  onSeeHowItWorks: () => void;
};

export function HeroSection({
  theme,
  onGetStarted,
  onLogIn,
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
        <div className="flex min-h-[420px] flex-col justify-center sm:min-h-[520px]">
          <div
            className="mb-5 inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 py-2"
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
              FUTURE SELF, BUILT DAILY
            </span>
          </div>

          <h1
            className="mb-4 text-[clamp(38px,9vw,80px)] leading-[0.98] tracking-[-0.04em]"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              color: t.text,
            }}
          >
            Stop postponing the person
            <br />
            <em style={{ color: t.primary, fontStyle: "italic" }}>
              you want to become.
            </em>
          </h1>

          <p
            className="mb-3 max-w-2xl text-[15px] leading-7 sm:text-[clamp(16px,2vw,19px)] sm:leading-8"
            style={{ color: t.muted }}
          >
            Begyn helps you turn goals, habits, health, and routines
            into visible daily progress — before “someday” turns into another year
            of waiting.
          </p>

          <p
            className="mb-6 max-w-2xl text-sm leading-7 sm:mb-7 sm:text-[15px] sm:leading-8"
            style={{ color: t.faint }}
          >
            You do not need perfect timing. You need one connected system that
            shows what matters today, keeps your momentum visible, and helps you
            follow through when motivation fades.
          </p>

          <div className="mb-6 flex min-h-[64px] flex-wrap gap-3">
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
              onClick={onLogIn}
              className="rounded-xl border px-5 py-6 text-sm font-semibold"
              style={{
                background: "transparent",
                borderColor: t.borderStrong,
                color: t.textSoft,
              }}
            >
              Log in
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

          <div className="flex min-h-[56px] flex-wrap gap-2.5">
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
