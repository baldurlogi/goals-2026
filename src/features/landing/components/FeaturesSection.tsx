import { FEATURE_CARDS } from "../data/features";
import { useReveal } from "../hooks/useReveal";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";
import { FeatureCard } from "./FeatureCard";

type FeaturesSectionProps = {
  theme: ThemeMode;
};

export function FeaturesSection({ theme }: FeaturesSectionProps) {
  const t = TOKENS[theme];
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
    >
      <div
        ref={ref}
        style={{
          textAlign: "center",
          marginBottom: 50,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.55s ease, transform 0.55s ease",
        }}
      >
        <div
          className="mb-4 font-mono text-[11px] tracking-[0.12em]"
          style={{ color: t.faint }}
        >
          WHY IT FEELS DIFFERENT
        </div>

        <h2
          className="text-[clamp(30px,4vw,46px)] leading-[1.08] tracking-[-0.03em]"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            color: t.text,
          }}
        >
          Not another task manager.
          <br />
          <em style={{ color: t.primary }}>
            A system that helps you move your life forward.
          </em>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {FEATURE_CARDS.map((item, i) => (
          <FeatureCard key={item.title} theme={theme} index={i} {...item} />
        ))}
      </div>
    </section>
  );
}