import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLandingTheme } from "./hooks/useLandingTheme";
import { LandingNavbar } from "./components/LandingNavbar";
import { HeroSection } from "./components/HeroSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { DifferentiationSection } from "./components";
import { PricingSection } from "./components/PricingSection";
import { FinalCtaSection } from "./components";
import { LandingFooter } from "./components";
import type { BillingMode } from "./types";
import { LandingShell } from "./components/LandingShell";

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useLandingTheme();
  const [billing, setBilling] = useState<BillingMode>("monthly");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <LandingShell theme={theme}>
      <LandingNavbar
        theme={theme}
        scrolled={scrolled}
        onToggleTheme={toggleTheme}
        onSignIn={() => navigate("/auth")}
        onGetStarted={() => navigate("/auth")}
      />

      <HeroSection
        theme={theme}
        onGetStarted={() => navigate("/auth")}
        onSeeHowItWorks={() =>
          document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
        }
      />

      <HowItWorksSection theme={theme} />
      <FeaturesSection theme={theme} />
      <DifferentiationSection theme={theme} />

      <PricingSection
        theme={theme}
        billing={billing}
        setBilling={setBilling}
        onChoosePlan={() => navigate("/auth")}
      />

      <FinalCtaSection
        theme={theme}
        onGetStarted={() => navigate("/auth")}
        onSeePricing={() =>
          document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
        }
      />

      <LandingFooter theme={theme} />
    </LandingShell>
  );
}