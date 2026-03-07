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
      style={{
        minHeight: "100vh",
        background: t.bg,
        color: t.text,
        fontFamily: "'DM Sans', sans-serif",
        overflowX: "hidden",
        transition: "background 0.25s ease, color 0.25s ease",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }
      `}</style>

      {children}
    </div>
  );
}