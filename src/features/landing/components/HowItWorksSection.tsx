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
      className="relative mx-auto max-w-7xl px-3 py-24 sm:px-6 lg:px-8"
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
        className="relative mb-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
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
          className="rounded-[30px] border p-5 text-center sm:p-6 lg:text-left"
          style={{
            background:
              theme === "dark"
                ? "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(11,18,32,0.72))"
                : "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))",
            borderColor: t.border,
            boxShadow: t.shadow,
          }}
        >
          <p
            className="text-sm leading-7 sm:text-[15px] sm:leading-8"
            style={{ color: t.textSoft }}
          >
            Most people do not need more motivation. They need a product that
            removes ambiguity, organizes the path, and gives the day a shape you
            can actually act on.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2.5 lg:justify-start">
            {checkpoints.map((label) => (
              <span
                key={label}
                className="rounded-full border px-3 py-1.5 text-[11px] font-mono tracking-[0.12em]"
                style={{
                  color: label === "Momentum" ? t.primary : t.textSoft,
                  background: label === "Momentum" ? t.primarySoft : t.surface3,
                  borderColor:
                    label === "Momentum" ? t.primaryBorder : t.border,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </m.div>

      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        <div
          className="pointer-events-none absolute left-[16px] right-[16px] top-[92px] hidden h-px md:block"
          style={{
            background: `linear-gradient(90deg, transparent, ${t.borderStrong}, transparent)`,
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
