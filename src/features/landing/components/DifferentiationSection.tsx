import { Card, CardContent } from "@/components/ui/card";
import { DIFFERENT_SECTION } from "../data/difference";
import { useReveal } from "../hooks/useReveal";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";

type DifferentiationSectionProps = {
  theme: ThemeMode;
};

export function DifferentiationSection({
  theme,
}: DifferentiationSectionProps) {
  const t = TOKENS[theme];
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section
      style={{
        padding: "40px 24px 90px",
        maxWidth: 1160,
        margin: "0 auto",
      }}
    >
      <div
        ref={ref}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.55s ease, transform 0.55s ease",
        }}
      >
        <Card
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 28,
            overflow: "hidden",
          }}
        >
          <CardContent style={{ padding: "30px 24px" }}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: t.faint,
                letterSpacing: "0.12em",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              WHY IT FEELS DIFFERENT
            </div>

            <h2
              className="mb-8 text-center text-[clamp(24px,3vw,36px)] leading-[1.1] tracking-[-0.03em]"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontWeight: 400,
                color: t.text,
              }}
            >
              Less scattered tracking.
              <br />
              <em style={{ color: t.primary }}>More visible follow-through.</em>
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 18,
              }}
            >
              {DIFFERENT_SECTION.map((item) => (
                <Card
                  key={item.title}
                  style={{
                    background: t.surface3,
                    border: `1px solid ${t.border}`,
                    borderRadius: 18,
                  }}
                >
                  <CardContent style={{ padding: 18 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: t.text,
                        marginBottom: 8,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        color: t.muted,
                        lineHeight: 1.75,
                      }}
                    >
                      {item.body}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
