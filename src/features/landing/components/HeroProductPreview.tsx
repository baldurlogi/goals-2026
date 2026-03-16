import { Card, CardContent } from "@/components/ui/card";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";

type HeroProductPreviewProps = {
  theme: ThemeMode;
};

export function HeroProductPreview({ theme }: HeroProductPreviewProps) {
  const t = TOKENS[theme];

  return (
    <Card
      className="h-full overflow-hidden rounded-3xl"
      style={{
        background: t.surface,
        border: `1px solid ${t.borderStrong}`,
        boxShadow: t.shadow,
        minHeight: 640,
      }}
    >
      <CardContent className="flex h-full flex-col p-4 sm:p-5">
        <div className="mb-4 flex h-6 items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: t.rose, opacity: 0.7 }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: t.amber, opacity: 0.7 }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: t.primary, opacity: 0.8 }}
          />
          <div
            className="flex-1 text-center font-mono text-[10px]"
            style={{ color: t.faint }}
          >
            Daily Life Progress
          </div>
        </div>

        <div className="grid flex-1 gap-4 xl:grid-cols-[1.25fr_0.95fr]">
          <div
            className="flex h-full min-h-[560px] flex-col rounded-3xl border p-4"
            style={{
              background: t.bgSoft,
              borderColor: t.border,
            }}
          >
            <div
              className="mb-3 font-mono text-[11px] tracking-[0.08em]"
              style={{ color: t.faint }}
            >
              AI GOAL PLANNER
            </div>

            <div
              className="mb-4 rounded-2xl border px-3 py-3 text-sm"
              style={{
                background: t.surface,
                borderColor: t.border,
                color: t.text,
                minHeight: 52,
              }}
            >
              I want to run a marathon by October
            </div>

            <div className="mb-4 flex min-h-[36px] flex-wrap gap-2">
              {[5, 8, 10].map((n, i) => (
                <div
                  key={n}
                  className="rounded-full border px-3 py-1.5 text-[11px]"
                  style={{
                    borderColor: i === 1 ? t.primaryBorder : t.border,
                    background: i === 1 ? t.primarySoft : t.surface,
                    color: i === 1 ? t.primary : t.muted,
                  }}
                >
                  {n} steps
                </div>
              ))}
            </div>

            <div
              className="flex flex-1 flex-col rounded-2xl border p-4"
              style={{
                background: t.surface,
                borderColor: t.border,
              }}
            >
              <div className="mb-3 flex min-h-[52px] items-center gap-3">
                <div className="text-2xl">🏃</div>
                <div>
                  <div
                    className="text-[15px] font-bold tracking-[-0.02em]"
                    style={{ color: t.text }}
                  >
                    Marathon by October
                  </div>
                  <div className="text-xs" style={{ color: t.muted }}>
                    AI plan generated · review before saving
                  </div>
                </div>
              </div>

              <div className="grid gap-0">
                {[
                  "Choose your marathon race",
                  "Build base mileage",
                  "Add a weekly long run",
                  "Practice fueling and pacing",
                ].map((item, i) => (
                  <div
                    key={item}
                    className="flex min-h-[48px] items-center gap-3 py-2.5"
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${t.border}`,
                    }}
                  >
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]"
                      style={{
                        background: i === 0 ? t.primarySoft : t.surface3,
                        borderColor: i === 0 ? t.primaryBorder : t.border,
                        color: i === 0 ? t.primary : t.muted,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="text-sm" style={{ color: t.textSoft }}>
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid auto-rows-fr gap-4">
            <div
              className="flex min-h-[164px] flex-col rounded-3xl border p-4"
              style={{
                background: t.bgSoft,
                borderColor: t.border,
              }}
            >
              <div
                className="mb-3 font-mono text-[11px] tracking-[0.08em]"
                style={{ color: t.faint }}
              >
                NEXT BEST ACTION
              </div>

              <div
                className="flex flex-1 flex-col justify-center rounded-2xl border p-4"
                style={{
                  background: t.surface,
                  borderColor: t.primaryBorder,
                }}
              >
                <div className="mb-1 text-xs font-bold" style={{ color: t.primary }}>
                  Today
                </div>
                <div
                  className="mb-1 text-[15px] font-bold tracking-[-0.02em]"
                  style={{ color: t.text }}
                >
                  Run 4 km after work
                </div>
                <div className="text-xs" style={{ color: t.muted }}>
                  30 minutes · keeps your marathon plan on track
                </div>
              </div>
            </div>

            <div
              className="flex min-h-[220px] flex-col rounded-3xl border p-4"
              style={{
                background: t.bgSoft,
                borderColor: t.border,
              }}
            >
              <div
                className="mb-3 font-mono text-[11px] tracking-[0.08em]"
                style={{ color: t.faint }}
              >
                LIFE PROGRESS
              </div>

              <div className="flex-1">
                {[
                  ["Goals", 72, t.primary],
                  ["Fitness", 81, t.blue],
                  ["Reading", 64, t.amber],
                  ["Consistency", 76, t.purple],
                ].map(([label, pct, color]) => (
                  <div key={label as string} className="mb-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span style={{ color: t.muted }}>{label}</span>
                      <span style={{ color: t.textSoft }}>{pct}%</span>
                    </div>

                    <div
                      className="h-2 overflow-hidden rounded-full border"
                      style={{
                        background: t.surface,
                        borderColor: t.border,
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: color as string,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex min-h-[176px] flex-col rounded-3xl border p-4"
              style={{
                background: t.bgSoft,
                borderColor: t.border,
              }}
            >
              <div
                className="mb-3 font-mono text-[11px] tracking-[0.08em]"
                style={{ color: t.faint }}
              >
                WHY PEOPLE STAY
              </div>

              <div className="grid flex-1 gap-2">
                {[
                  "You know what to do next",
                  "You can see your momentum",
                  "Your daily actions feel connected",
                ].map((line) => (
                  <div key={line} className="flex items-start gap-2 text-sm">
                    <span style={{ color: t.primary }}>●</span>
                    <span style={{ color: t.textSoft }}>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}