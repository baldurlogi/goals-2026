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
        transition: "background 0.25s ease, color 0.25s ease",
      }}
    >
      {children}
    </div>
  );
}