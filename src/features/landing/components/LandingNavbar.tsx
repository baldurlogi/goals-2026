import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";
import { ThemeToggle } from "./ThemeToggle";

type LandingNavbarProps = {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
};

export function LandingNavbar({
  theme,
  onToggleTheme,
  onSignIn,
  onGetStarted,
}: LandingNavbarProps) {
  const t = TOKENS[theme];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frameId = 0;

    const updateScrolled = () => {
      const next = window.scrollY > 20;
      setScrolled((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateScrolled();
      });
    };

    updateScrolled();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 h-16 px-4 sm:px-6 lg:px-8"
      style={{
        backdropFilter: "blur(14px)",
        background: scrolled
          ? theme === "dark"
            ? "rgba(6,11,20,0.82)"
            : "rgba(248,250,252,0.86)"
          : "transparent",
        borderBottom: scrolled ? `1px solid ${t.border}` : "1px solid transparent",
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-mono text-sm tracking-[0.06em]"
          style={{ color: t.text }}
        >
          DAILY<span style={{ color: t.primary }}> LIFE</span> PROGRESS
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollTo("how-it-works")}
            className="px-3 py-2 text-sm transition-opacity"
            style={{ color: t.muted }}
          >
            How it works
          </button>

          <button
            type="button"
            onClick={() => scrollTo("features")}
            className="px-3 py-2 text-sm transition-opacity"
            style={{ color: t.muted }}
          >
            Why it works
          </button>

          <button
            type="button"
            onClick={() => scrollTo("pricing")}
            className="px-3 py-2 text-sm transition-opacity"
            style={{ color: t.muted }}
          >
            Pricing
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />

          <Button
            type="button"
            variant="ghost"
            onClick={onSignIn}
            className="hidden rounded-xl border px-4 md:inline-flex"
            style={{
              background: "transparent",
              borderColor: t.border,
              color: t.textSoft,
            }}
          >
            Sign in
          </Button>

          <Button
            type="button"
            onClick={onGetStarted}
            className="rounded-xl px-4 font-semibold"
            style={{
              background: t.primary,
              color: theme === "dark" ? "#052e16" : "#ffffff",
            }}
          >
            Start free
          </Button>
        </div>
      </div>
    </nav>
  );
}