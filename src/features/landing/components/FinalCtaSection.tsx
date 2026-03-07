import { Button } from "@/components/ui/button";
import { useReveal } from "../hooks/useReveal";
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
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="relative px-4 pb-28 pt-24 text-center sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: t.heroGlow,
          opacity: 0.6,
        }}
      />

      <div
        ref={ref}
        className="relative mx-auto max-w-4xl"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.55s ease, transform 0.55s ease",
        }}
      >
        <h2
          className="mb-4 text-[clamp(34px,5vw,58px)] leading-[1.05] tracking-[-0.04em]"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            color: t.text,
          }}
        >
          Stop feeling behind.
          <br />
          <em style={{ color: t.primary }}>
            Start making visible progress.
          </em>
        </h2>

        <p
          className="mx-auto mb-8 max-w-2xl text-sm leading-8 sm:text-[15px]"
          style={{ color: t.faint }}
        >
          Daily Life Progress is built for people with meaningful ambitions,
          busy lives, and brains that need clarity more than more noise.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={onGetStarted}
            className="rounded-xl px-6 py-6 text-sm font-semibold"
            style={{
              background: t.primary,
              color: theme === "dark" ? "#052e16" : "#ffffff",
            }}
          >
            Create your account →
          </Button>

          {onSeePricing && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSeePricing}
              className="rounded-xl border px-6 py-6 text-sm font-semibold"
              style={{
                background: "transparent",
                borderColor: t.borderStrong,
                color: t.textSoft,
              }}
            >
              See pricing
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}