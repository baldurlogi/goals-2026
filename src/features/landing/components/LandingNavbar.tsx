import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, m } from "framer-motion";
import { fadeUp, landingEase, staggerContainer } from "../motion";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";

type LandingNavbarProps = {
  theme: ThemeMode;
  onSignIn: () => void;
  onGetStarted: () => void;
};

export function LandingNavbar({
  theme,
  onSignIn,
  onGetStarted,
}: LandingNavbarProps) {
  const t = TOKENS[theme];
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  function handleMobileScrollTo(id: string) {
    scrollTo(id);
    setIsMobileMenuOpen(false);
  }

  function handleMobileSignIn() {
    onSignIn();
    setIsMobileMenuOpen(false);
  }

  return (
    <m.nav
      className="fixed inset-x-0 top-0 z-50 h-16 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: landingEase }}
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
          <span style={{ color: t.primary }}>BEGYN</span>
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
            Why it sticks
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
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-mobile-menu"
            className="rounded-xl border px-3 md:hidden"
            style={{
              background: "transparent",
              borderColor: t.border,
              color: t.textSoft,
            }}
          >
            Menu
          </Button>

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
            Log in
          </Button>

          <Button
            type="button"
            onClick={onGetStarted}
            className="rounded-xl px-3 text-sm font-semibold sm:px-4"
            style={{
              background: t.primary,
              color: theme === "dark" ? "#052e16" : "#ffffff",
            }}
          >
            Start free
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isMobileMenuOpen ? (
          <m.div
            id="landing-mobile-menu"
            className="mx-auto mt-2 w-full max-w-7xl rounded-2xl border p-2 md:hidden"
            initial={{ opacity: 0, y: -10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.22, ease: landingEase }}
            style={{
              background:
                theme === "dark"
                  ? "rgba(6,11,20,0.96)"
                  : "rgba(255,255,255,0.97)",
              borderColor: t.border,
            }}
          >
            <m.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer(0.06, 0.02)}
            >
              <m.button
                type="button"
                onClick={() => handleMobileScrollTo("how-it-works")}
                className="w-full rounded-xl px-3 py-2 text-left text-sm"
                variants={fadeUp(10)}
                style={{ color: t.textSoft }}
              >
                How it works
              </m.button>
              <m.button
                type="button"
                onClick={() => handleMobileScrollTo("features")}
                className="w-full rounded-xl px-3 py-2 text-left text-sm"
                variants={fadeUp(10)}
                style={{ color: t.textSoft }}
              >
                Why it sticks
              </m.button>
              <m.button
                type="button"
                onClick={() => handleMobileScrollTo("pricing")}
                className="w-full rounded-xl px-3 py-2 text-left text-sm"
                variants={fadeUp(10)}
                style={{ color: t.textSoft }}
              >
                Pricing
              </m.button>
              <m.button
                type="button"
                onClick={handleMobileSignIn}
                className="w-full rounded-xl px-3 py-2 text-left text-sm"
                variants={fadeUp(10)}
                style={{ color: t.textSoft }}
              >
                Log in
              </m.button>
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.nav>
  );
}
