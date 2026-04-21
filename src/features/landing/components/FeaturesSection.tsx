import { m } from "framer-motion";
import { FEATURE_CARDS } from "../data/features";
import { fadeUp, landingViewport } from "../motion";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";
import { FeatureCard } from "./FeatureCard";

type FeaturesSectionProps = {
  theme: ThemeMode;
};

export function FeaturesSection({ theme }: FeaturesSectionProps) {
  const t = TOKENS[theme];
  const [spotlight, ...secondaryCards] = FEATURE_CARDS;
  const outcomes = [
    "less mental clutter",
    "clearer daily direction",
    "progress you can feel",
  ];

  return (
    <section
      id="features"
      className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-24 h-72 blur-3xl"
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(circle at 70% 30%, rgba(96,165,250,0.12), transparent 42%), radial-gradient(circle at 20% 70%, rgba(192,132,252,0.12), transparent 38%)"
              : "radial-gradient(circle at 70% 30%, rgba(37,99,235,0.08), transparent 42%), radial-gradient(circle at 20% 70%, rgba(124,58,237,0.08), transparent 38%)",
        }}
      />

      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={landingViewport}
        variants={fadeUp(18)}
        className="relative mb-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"
      >
        <div>
          <div
            className="mb-4 font-mono text-[11px] tracking-[0.18em]"
            style={{ color: t.faint }}
          >
            WHY IT STICKS
          </div>

          <h2
            className="max-w-[13ch] text-[clamp(32px,5vw,54px)] leading-[0.98] tracking-[-0.04em] sm:max-w-none"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              color: t.text,
            }}
          >
            It makes the next move
            <br />
            feel <em style={{ color: t.primary }}>obvious, calm, and worth doing.</em>
          </h2>
        </div>

        <div>
          <p
            className="max-w-2xl text-sm leading-7 sm:text-[15px] sm:leading-8"
            style={{ color: t.textSoft }}
          >
            The product is designed to reduce drift, make your next move obvious,
            and keep your goals, routines, and energy pointed in the same direction.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {outcomes.map((item) => (
              <span
                key={item}
                className="rounded-full border px-3 py-1.5 text-[11px] font-mono tracking-[0.12em]"
                style={{
                  color: t.textSoft,
                  borderColor: t.border,
                  background: t.surface3,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </m.div>

      <div className="relative grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          variants={fadeUp(20)}
          className="relative overflow-hidden rounded-[34px] border p-6 sm:p-8"
          style={{
            borderColor: t.borderStrong,
            background:
              theme === "dark"
                ? "linear-gradient(155deg, rgba(11,18,32,0.95), rgba(15,23,42,0.92))"
                : "linear-gradient(155deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))",
            boxShadow: t.shadow,
          }}
        >
          <div
            className="pointer-events-none absolute inset-y-0 right-[-20%] w-[60%] blur-3xl"
            style={{
              background:
                theme === "dark"
                  ? "radial-gradient(circle, rgba(74,222,128,0.18), transparent 62%)"
                  : "radial-gradient(circle, rgba(22,163,74,0.12), transparent 62%)",
            }}
          />

          <div
            className="relative inline-flex rounded-full border px-3 py-1 text-[11px] font-mono tracking-[0.14em]"
            style={{
              color: t.primary,
              borderColor: t.primaryBorder,
              background: t.primarySoft,
            }}
          >
            THE CORE IDEA
          </div>

          <div className="relative mt-5 max-w-xl">
            <div
              className="mb-3 text-[clamp(28px,4.2vw,44px)] leading-[1.02] tracking-[-0.04em]"
              style={{
                fontFamily: "'Instrument Serif', serif",
                color: t.text,
              }}
            >
              {spotlight.title}
            </div>

            <p
              className="max-w-lg text-sm leading-7 sm:text-[15px] sm:leading-8"
              style={{ color: t.textSoft }}
            >
              {spotlight.body}
            </p>
          </div>

          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["One place", "for goals, habits, health, and routines"],
              ["One focus", "so the day does not split your attention"],
              ["One rhythm", "that keeps progress visible over time"],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-[22px] border p-4"
                style={{
                  borderColor: t.border,
                  background: t.surface3,
                }}
              >
                <div
                  className="mb-2 text-[12px] font-mono tracking-[0.12em]"
                  style={{ color: t.primary }}
                >
                  {title}
                </div>
                <div className="text-sm leading-6" style={{ color: t.muted }}>
                  {body}
                </div>
              </div>
            ))}
          </div>
        </m.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {secondaryCards.map((item, i) => (
            <FeatureCard
              key={item.title}
              theme={theme}
              index={i + 1}
              {...item}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
