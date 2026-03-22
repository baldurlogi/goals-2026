import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";

type LandingFooterProps = {
  theme: ThemeMode;
};

export function LandingFooter({ theme }: LandingFooterProps) {
  const t = TOKENS[theme];

  return (
    <footer
      className="px-4 pb-8 pt-6 sm:px-6 lg:px-8"
      style={{
        borderTop: `1px solid ${t.border}`,
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div
          className="font-mono text-xs tracking-[0.06em]"
          style={{ color: t.faint }}
        >
          <span style={{ color: t.primary }}>BEGYN</span>
        </div>

        <div
          className="font-mono text-xs"
          style={{ color: t.faint }}
        >
          © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}