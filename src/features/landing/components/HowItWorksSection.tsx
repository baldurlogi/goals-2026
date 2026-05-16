import { m } from "framer-motion";
import { HOW_IT_WORKS } from "../data/howItWorks";
import { fadeUp, landingViewport } from "../motion";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";
import { HowItWorksCard } from "./HowItWorksCard";

type HowItWorksSectionProps = {
  theme: ThemeMode;
};

export function HowItWorksSection({ theme }: HowItWorksSectionProps) {
  const t = TOKENS[theme];
  const checkpoints = ["Goal", "Roadmap", "Momentum"];

  return (
    <section
      id="how-it-works"
      className="relative mx-auto max-w-7xl px-3 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-10 h-64 blur-3xl"
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(circle at top left, rgba(74,222,128,0.14), transparent 58%)"
              : "radial-gradient(circle at top left, rgba(22,163,74,0.10), transparent 58%)",
        }}
      />

      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={landingViewport}
        variants={fadeUp(18)}
        className="relative mb-14 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end"
      >
        <div className="text-center lg:text-left">
          <div
            className="mb-4 font-mono text-[11px] tracking-[0.18em]"
            style={{ color: t.faint }}
          >
            HOW IT WORKS
          </div>

          <h2
            className="mx-auto max-w-none text-[clamp(32px,5vw,54px)] leading-[0.98] tracking-[-0.04em] lg:mx-0 lg:max-w-[12ch]"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              color: t.text,
            }}
          >
            A clearer path
            <br />
            from intention to
            <br />
            <em style={{ color: t.primary }}>visible follow-through.</em>
          </h2>
        </div>

        <div
          className="relative text-center lg:text-left"
          style={{
            color: t.textSoft,
          }}
        >
          <div
            className="pointer-events-none absolute -left-8 top-1/2 hidden h-28 w-px -translate-y-1/2 lg:block"
            style={{
              background: `linear-gradient(to bottom, transparent, ${t.primaryBorder}, transparent)`,
            }}
          />
          <p
            className="text-sm leading-7 sm:text-[15px] sm:leading-8 lg:max-w-xl"
            style={{ color: t.textSoft }}
          >
            Most people do not need more motivation. They need a product that
            removes ambiguity, organizes the path, and gives the day a shape you
            can actually act on.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
            {checkpoints.map((label) => (
              <span
                key={label}
                className="rounded-full px-3 py-1.5 text-[11px] font-mono tracking-[0.12em]"
                style={{
                  color: label === "Momentum" ? t.primary : t.textSoft,
                  background:
                    label === "Momentum"
                      ? t.primarySoft
                      : "rgba(255,255,255,0.035)",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </m.div>

      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4 lg:gap-6">
        <div
          className="pointer-events-none absolute left-[16px] right-[16px] top-[96px] hidden h-px md:block"
          style={{
            background: `linear-gradient(90deg, transparent, ${t.primaryBorder}, ${t.borderStrong}, transparent)`,
          }}
        />
        {HOW_IT_WORKS.map((item, i) => (
          <HowItWorksCard
            key={item.step}
            theme={theme}
            index={i}
            {...item}
          />
        ))}
      </div>
    </section>
  );
}
