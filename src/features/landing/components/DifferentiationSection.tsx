import { m } from "framer-motion";
import { DIFFERENT_SECTION } from "../data/difference";
import { fadeUp, landingViewport } from "../motion";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";

type DifferentiationSectionProps = {
  theme: ThemeMode;
};

export function DifferentiationSection({
  theme,
}: DifferentiationSectionProps) {
  const t = TOKENS[theme];

  return (
    <section
      className="relative mx-auto max-w-7xl px-3 pb-20 pt-8 sm:px-6 sm:pb-24 lg:px-8"
    >
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={landingViewport}
        variants={fadeUp(18)}
        className="relative overflow-hidden px-2 py-8 sm:px-4 sm:py-10 lg:px-0"
        style={{
          background: "transparent",
        }}
      >
        <div
          className="pointer-events-none absolute left-[-10%] top-[-18%] h-56 w-56 rounded-full blur-3xl"
          style={{
            background:
              theme === "dark"
                ? "radial-gradient(circle, rgba(74,222,128,0.16), transparent 68%)"
                : "radial-gradient(circle, rgba(22,163,74,0.10), transparent 68%)",
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-4 top-1/2 hidden h-px lg:block"
          style={{
            background: `linear-gradient(90deg, transparent, ${t.borderStrong}, transparent)`,
          }}
        />

        <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="text-center lg:pr-4 lg:text-left">
            <div
              className="mb-4 font-mono text-[11px] tracking-[0.18em]"
              style={{ color: t.faint }}
            >
              WHY PEOPLE STAY
            </div>

            <h2
              className="mx-auto max-w-none text-[clamp(30px,4.6vw,50px)] leading-[0.98] tracking-[-0.04em] lg:mx-0 lg:max-w-[12ch]"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontWeight: 400,
                color: t.text,
              }}
            >
              Not another place to plan.
              <br />
              <em style={{ color: t.primary }}>
                A system that keeps helping you show up.
              </em>
            </h2>

            <p
              className="mx-auto mt-4 max-w-xl text-sm leading-7 sm:text-[15px] sm:leading-8 lg:mx-0"
              style={{ color: t.textSoft }}
            >
              Most tools are good at collecting intentions. This one is designed
              to lower friction, create clarity, and make the future you care
              about feel present in the day you are living now.
            </p>

            <div
              className="mt-8 border-l px-5 py-1 text-center lg:text-left"
              style={{
                borderColor: t.primaryBorder,
              }}
            >
              <div
                className="mb-3 text-[11px] font-mono tracking-[0.14em]"
                style={{ color: t.primary }}
              >
                WHAT CHANGES
              </div>
              <div
                className="text-[18px] leading-[1.5] tracking-[-0.03em]"
                style={{ color: t.text }}
              >
                “I should do something about my life” starts turning into “I know
                exactly what today asks of me.”
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {DIFFERENT_SECTION.map((item, index) => (
              <m.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={landingViewport}
                variants={fadeUp(18, index * 0.06)}
                className={[
                  "relative overflow-hidden px-5 py-5 sm:px-6",
                  index === 1 ? "rounded-[30px]" : "",
                ].join(" ")}
                style={{
                  background:
                    index === 1
                      ? theme === "dark"
                        ? "linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018))"
                        : "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(239,246,255,0.85))"
                      : "transparent",
                  boxShadow:
                    index === 1 ? `inset 0 0 0 1px ${t.border}` : undefined,
                }}
              >
                <div
                  className="pointer-events-none absolute right-[-18px] top-[-18px] h-24 w-24 rounded-full blur-3xl"
                  style={{
                    background:
                      index === 0
                        ? `${t.primary}16`
                        : index === 1
                          ? `${t.blue}18`
                          : `${t.amber}16`,
                  }}
                />

                <div className="relative flex gap-4 sm:gap-5">
                  <div
                    className="min-w-[44px] text-[22px] leading-none tracking-[-0.04em] sm:min-w-[52px] sm:text-[28px]"
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      color: index === 0 ? t.primary : index === 1 ? t.blue : t.amber,
                    }}
                  >
                    0{index + 1}
                  </div>

                  <div>
                    <div
                      className="mb-2 text-lg font-semibold tracking-[-0.03em]"
                      style={{ color: t.text }}
                    >
                      {item.title}
                    </div>
                    <div className="text-sm leading-7" style={{ color: t.muted }}>
                      {item.body}
                    </div>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </m.div>
    </section>
  );
}
