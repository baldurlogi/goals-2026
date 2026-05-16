import type { ReactNode } from "react";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";

type LandingShellProps = {
  theme: ThemeMode;
  children: ReactNode;
};

export function LandingShell({ theme, children }: LandingShellProps) {
  const t = TOKENS[theme];

  return (
    <div
      className="relative isolate overflow-x-clip"
      style={{
        minHeight: "100svh",
        background: t.bg,
        color: t.text,
        transition: "background 0.25s ease, color 0.25s ease",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(circle at 18% 8%, rgba(74,222,128,0.10), transparent 30%), radial-gradient(circle at 88% 18%, rgba(96,165,250,0.08), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.018), transparent 38%)"
              : t.heroGlow,
        }}
      />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[120svh] opacity-50"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to bottom, black, transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
