import { m } from "framer-motion";
import { fadeUp, landingViewport } from "../motion";
import { TOKENS } from "../theme/tokens";
import type { HowItWorksItem, ThemeMode } from "../types";

type HowItWorksCardProps = HowItWorksItem & {
  theme: ThemeMode;
  index: number;
};

export function HowItWorksCard({
  theme,
  step,
  title,
  body,
  index,
}: HowItWorksCardProps) {
  const t = TOKENS[theme];
  const accents = [t.primary, t.blue, t.amber];
  const accent = accents[index % accents.length];
  const labels = ["Set the direction", "Shape the route", "Move today"];
  const topSpacing =
    index === 1 ? "md:mt-12" : index === 2 ? "md:mt-24" : "md:mt-0";

  return (
    <m.div
      className={`${topSpacing} relative`}
      initial="hidden"
      whileInView="visible"
      viewport={landingViewport}
      variants={fadeUp(20, index * 0.08)}
    >
      <div
        className="relative overflow-hidden rounded-[30px] px-5 pb-6 pt-5 transition-transform duration-500 hover:-translate-y-1 sm:px-6 sm:pb-7 sm:pt-6"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.014))"
              : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.86))",
          boxShadow:
            index === 1
              ? `0 30px 90px rgba(0,0,0,0.24), inset 0 0 0 1px ${accent}33`
              : `inset 0 0 0 1px ${t.border}`,
          }}
        >
          <div
            className="pointer-events-none absolute right-[-28px] top-[-28px] h-28 w-28 rounded-full blur-3xl"
            style={{ background: `${accent}22` }}
          />

          <div className="mb-6 flex items-center justify-between gap-3">
            <div
              className="inline-flex rounded-full px-3 py-1 text-[11px] font-mono tracking-[0.14em]"
              style={{
                color: accent,
                background: `${accent}14`,
              }}
            >
              STEP {step}
            </div>

            <div
              className="text-[11px] font-mono tracking-[0.14em]"
              style={{ color: t.faint }}
            >
              {labels[index]}
            </div>
          </div>

          <div className="mb-5 flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold"
              style={{
                color: accent,
                background: `${accent}15`,
                boxShadow: `0 0 42px ${accent}22`,
              }}
            >
              {step}
            </div>

            <div
              className="h-px flex-1"
              style={{
                background: `linear-gradient(90deg, ${accent}55, transparent)`,
              }}
            />
          </div>

          <div
            className="mb-3 max-w-[16ch] text-xl font-semibold leading-[1.1] tracking-[-0.03em]"
            style={{ color: t.text }}
          >
            {title}
          </div>

          <div
            className="text-sm leading-7 sm:text-[15px] sm:leading-7"
            style={{ color: t.muted }}
          >
            {body}
          </div>
      </div>
    </m.div>
  );
}
