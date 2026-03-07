import { Card, CardContent } from "@/components/ui/card";
import { useReveal } from "../hooks/useReveal";
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
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <Card
      ref={ref}
      className="rounded-3xl"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.55s ease ${index * 0.08}s, transform 0.55s ease ${index * 0.08}s`,
        background: t.surface,
        border: `1px solid ${t.border}`,
      }}
    >
      <CardContent className="p-6">
        <div
          className="mb-3 font-mono text-[11px] tracking-[0.12em]"
          style={{ color: t.primary }}
        >
          STEP {step}
        </div>

        <div
          className="mb-2 text-lg font-bold tracking-[-0.02em]"
          style={{ color: t.text }}
        >
          {title}
        </div>

        <div
          className="text-sm leading-7"
          style={{ color: t.muted }}
        >
          {body}
        </div>
      </CardContent>
    </Card>
  );
}