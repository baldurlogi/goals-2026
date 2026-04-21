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
      className={topSpacing}
      initial="hidden"
      whileInView="visible"
      viewport={landingViewport}
      variants={fadeUp(20, index * 0.08)}
    >
      <div
        className="relative overflow-hidden rounded-[30px] p-[1px]"
        style={{
          background: `linear-gradient(160deg, ${accent}55, ${t.borderStrong})`,
          boxShadow: t.shadow,
        }}
      >
        <div
          className="relative h-full rounded-[29px] px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6"
          style={{
            background:
              theme === "dark"
                ? "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(6,11,20,0.92))"
                : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
          }}
        >
          <div
            className="pointer-events-none absolute right-[-28px] top-[-28px] h-28 w-28 rounded-full blur-3xl"
            style={{ background: `${accent}22` }}
          />

          <div className="mb-6 flex items-center justify-between gap-3">
            <div
              className="inline-flex rounded-full border px-3 py-1 text-[11px] font-mono tracking-[0.14em]"
              style={{
                color: accent,
                borderColor: `${accent}44`,
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
              className="flex h-14 w-14 items-center justify-center rounded-[22px] border text-base font-semibold"
              style={{
                color: accent,
                borderColor: `${accent}40`,
                background: `${accent}15`,
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
      </div>
    </m.div>
  );
}
