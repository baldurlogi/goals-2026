import { HOW_IT_WORKS } from "../data/howItWorks";
import { useReveal } from "../hooks/useReveal";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";
import { HowItWorksCard } from "./HowItWorksCard";

type HowItWorksSectionProps = {
  theme: ThemeMode;
};

export function HowItWorksSection({ theme }: HowItWorksSectionProps) {
  const t = TOKENS[theme];
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
    >
      <div
        ref={ref}
        style={{
          textAlign: "center",
          marginBottom: 44,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.55s ease, transform 0.55s ease",
        }}
      >
        <div
          className="mb-4 font-mono text-[11px] tracking-[0.12em]"
          style={{ color: t.faint }}
        >
          HOW IT WORKS
        </div>

        <h2
          className="mb-3 text-[clamp(30px,4vw,46px)] leading-[1.08] tracking-[-0.03em]"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            color: t.text,
          }}
        >
          From overwhelming ambition
          <br />
          <em style={{ color: t.primary }}>
            to clear daily momentum.
          </em>
        </h2>

        <p
          className="mx-auto max-w-2xl text-sm leading-8 sm:text-[15px]"
          style={{ color: t.faint }}
        >
          The product is designed around one feeling: helping users stop
          wondering where to start and start making visible progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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