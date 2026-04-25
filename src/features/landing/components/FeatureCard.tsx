import { m } from "framer-motion";
import { fadeUp, landingViewport } from "../motion";
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
  const accentColor = t[accent];
  const labels = [
    "clear direction",
    "less juggling",
    "connected progress",
    "calmer ambition",
  ];
  const topSpacing =
    index % 2 === 0 ? "xl:mr-6" : "xl:ml-6";

  return (
    <m.div
      className={topSpacing}
      initial="hidden"
      whileInView="visible"
      viewport={landingViewport}
      variants={fadeUp(24, index * 0.08)}
    >
      <div
        className="relative overflow-hidden rounded-[28px] border px-5 pb-5 pt-6 sm:px-6 sm:pb-6"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(150deg, rgba(15,23,42,0.98), rgba(11,18,32,0.88))"
              : "linear-gradient(150deg, rgba(255,255,255,0.98), rgba(248,250,252,0.9))",
          border: `1px solid ${t.borderStrong}`,
          boxShadow: t.shadow,
        }}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, transparent 80%)`,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: -26,
            right: -20,
            width: 108,
            height: 108,
            borderRadius: "999px",
            background: accentColor,
            opacity: 0.12,
            filter: "blur(36px)",
            pointerEvents: "none",
          }}
        />

        <div className="relative">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[18px] border text-xl"
              style={{
                background: `${accentColor}18`,
                borderColor: `${accentColor}33`,
                color: accentColor,
              }}
            >
              {icon}
            </div>

            <div
              className="text-[11px] font-mono tracking-[0.14em]"
              style={{ color: t.faint }}
            >
              {labels[index]}
            </div>
          </div>

          <div
            className="mb-3 max-w-[16ch] text-xl font-semibold leading-[1.08] tracking-[-0.03em]"
            style={{ color: t.text }}
          >
            {title}
          </div>

          <div className="text-sm leading-7" style={{ color: t.muted }}>
            {body}
          </div>

          <div
            className="mt-6 h-px w-full"
            style={{
              background: `linear-gradient(90deg, ${accentColor}50, transparent)`,
            }}
          />
        </div>
      </div>
    </m.div>
  );
}
