import { Suspense, lazy, useEffect, useState } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LandingNavbar } from "./components/LandingNavbar";
import { HeroSection } from "./components/HeroSection";
import type { BillingMode } from "./types";
import { LandingShell } from "./components/LandingShell";

const HowItWorksSection = lazy(async () => ({
  default: (await import("./components/HowItWorksSection")).HowItWorksSection,
}));

const FeaturesSection = lazy(async () => ({
  default: (await import("./components/FeaturesSection")).FeaturesSection,
}));

const DifferentiationSection = lazy(async () => ({
  default: (await import("./components/DifferentiationSection"))
    .DifferentiationSection,
}));

const PricingSection = lazy(async () => ({
  default: (await import("./components/PricingSection")).PricingSection,
}));

const FinalCtaSection = lazy(async () => ({
  default: (await import("./components/FinalCtaSection")).FinalCtaSection,
}));

const LandingFooter = lazy(async () => ({
  default: (await import("./components/LandingFooter")).LandingFooter,
}));

function scheduleIdle(callback: () => void, delay = 0) {
  let timeoutId: number | null = null;
  let idleId: number | null = null;

  const run = () => {
    const w = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        options?: { timeout: number }
      ) => number;
    };

    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(callback, { timeout: 1500 });
      return;
    }

    timeoutId = window.setTimeout(callback, 1);
  };

  timeoutId = window.setTimeout(run, delay);

  return () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    const w = window as Window & {
      cancelIdleCallback?: (id: number) => void;
    };

    if (idleId !== null && typeof w.cancelIdleCallback === "function") {
      w.cancelIdleCallback(idleId);
    }
  };
}

function useDeferredMount(delay = 0) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cancel = scheduleIdle(() => setReady(true), delay);
    return cancel;
  }, [delay]);

  return ready;
}

function SectionPlaceholder({
  id,
  minHeight,
}: {
  id?: string;
  minHeight: number;
}) {
  return (
    <section
      id={id}
      aria-hidden="true"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      style={{ minHeight }}
    />
  );
}

function DeferredSection({
  when,
  fallback,
  children,
}: {
  when: boolean;
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!when) return <>{fallback}</>;

  return <Suspense fallback={fallback}>{children}</Suspense>;
}

export function LandingPage() {
  const navigate = useNavigate();
  const theme = "dark";
  const [billing, setBilling] = useState<BillingMode>("monthly");

  const showStageOne = useDeferredMount(120);
  const showStageTwo = useDeferredMount(700);

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <LandingShell theme={theme}>
          <LandingNavbar
            theme={theme}
            onSignIn={() => navigate("/login")}
            onGetStarted={() => navigate("/signup")}
          />

          <HeroSection
            theme={theme}
            onGetStarted={() => navigate("/signup")}
            onSeeHowItWorks={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          />

          <DeferredSection
            when={showStageOne}
            fallback={<SectionPlaceholder id="how-it-works" minHeight={640} />}
          >
            <HowItWorksSection theme={theme} />
          </DeferredSection>

          <DeferredSection
            when={showStageOne}
            fallback={<SectionPlaceholder id="features" minHeight={720} />}
          >
            <FeaturesSection theme={theme} />
          </DeferredSection>

          <DeferredSection
            when={showStageOne}
            fallback={<SectionPlaceholder minHeight={640} />}
          >
            <DifferentiationSection theme={theme} />
          </DeferredSection>

          <DeferredSection
            when={showStageTwo}
            fallback={<SectionPlaceholder id="pricing" minHeight={760} />}
          >
            <PricingSection
              theme={theme}
              billing={billing}
              setBilling={setBilling}
              onChoosePlan={() => navigate("/signup")}
            />
          </DeferredSection>

          <DeferredSection
            when={showStageTwo}
            fallback={<SectionPlaceholder minHeight={320} />}
          >
            <FinalCtaSection
              theme={theme}
              onGetStarted={() => navigate("/signup")}
              onSeePricing={() =>
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            />
          </DeferredSection>

          <DeferredSection
            when={showStageTwo}
            fallback={<SectionPlaceholder minHeight={140} />}
          >
            <LandingFooter theme={theme} />
          </DeferredSection>
        </LandingShell>
      </MotionConfig>
    </LazyMotion>
  );
}
