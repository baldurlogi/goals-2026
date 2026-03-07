import { Card, CardContent } from "@/components/ui/card";
import { useReveal } from "../hooks/useReveal";
import { TOKENS } from "../theme/tokens";
import type { FeatureCardItem, ThemeMode } from "../types";

type FeatureCardProps = FeatureCardItem & {
  theme: ThemeMode;
  index: number;
};

export function FeatureCard({
  theme,
  icon,
  title,
  body,
  accent,
  index,
}: FeatureCardProps) {
  const t = TOKENS[theme];
  const { ref, visible } = useReveal<HTMLDivElement>();
  const accentColor = t[accent];

  return (
    <Card
      ref={ref}
      className="relative overflow-hidden rounded-3xl"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.55s ease ${index * 0.08}s, transform 0.55s ease ${index * 0.08}s`,
        background: t.surface,
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "999px",
          background: accentColor,
          opacity: 0.08,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      <CardContent className="p-6">
        <div
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border text-xl"
          style={{
            background: `${accentColor}18`,
            borderColor: `${accentColor}33`,
            color: accentColor,
          }}
        >
          {icon}
        </div>

        <div
          className="mb-2 text-lg font-bold tracking-[-0.02em]"
          style={{ color: t.text }}
        >
          {title}
        </div>

        <div className="text-sm leading-7" style={{ color: t.muted }}>
          {body}
        </div>
      </CardContent>
    </Card>
  );
}