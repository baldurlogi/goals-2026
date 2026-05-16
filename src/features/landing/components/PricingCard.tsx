import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { m } from "framer-motion";
import { useState, type FormEvent } from "react";
import { TOKENS } from "../theme/tokens";
import type { BillingMode, PricingPlan, ThemeMode } from "../types";
import { PAID_PLANS_COMING_SOON_LABEL } from "@/features/subscription/subscriptionConfig";
import { fadeUp, landingViewport } from "../motion";
import {
  joinLaunchWaitlist,
  LaunchWaitlistError,
} from "@/features/landing/waitlist";

type PricingCardProps = PricingPlan & {
  theme: ThemeMode;
  billing: BillingMode;
  onChoosePlan: () => void;
  index: number;
};

function formatMonthlyEquivalent(yearly: number) {
  return (yearly / 12).toFixed(2);
}

export function PricingCard({
  id,
  theme,
  billing,
  onChoosePlan,
  name,
  sub,
  monthly,
  yearly,
  featured,
  cta,
  points,
  comingSoon,
  index,
}: PricingCardProps) {
  const t = TOKENS[theme];
  const isFree = monthly === 0;
  const isYearly = billing === "yearly";
  const displayPrice = isYearly ? yearly : monthly;
  const equivalentMonthly = !isFree ? formatMonthlyEquivalent(yearly) : null;
  const isPreviewOnly = Boolean(comingSoon);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistState, setWaitlistState] = useState<"idle" | "success" | "error">("idle");
  const [waitlistMessage, setWaitlistMessage] = useState<string | null>(null);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

  async function handleJoinWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isPreviewOnly || isJoiningWaitlist) return;

    setIsJoiningWaitlist(true);
    setWaitlistState("idle");
    setWaitlistMessage(null);

    try {
      const result = await joinLaunchWaitlist({
        email: waitlistEmail,
        planId: id,
      });
      setWaitlistState("success");
      setWaitlistMessage(
        result.message ??
          "Check your inbox and confirm your email to join the waitlist.",
      );
      setWaitlistEmail("");
    } catch (error) {
      const message =
        error instanceof LaunchWaitlistError
          ? error.message
          : "Couldn't save your email just now. Please try again.";
      setWaitlistState("error");
      setWaitlistMessage(message);
    } finally {
      setIsJoiningWaitlist(false);
    }
  }

  return (
    <m.div
      className="h-full"
      initial="hidden"
      whileInView="visible"
      viewport={landingViewport}
      variants={fadeUp(24, index * 0.08)}
    >
      <div
        className="relative h-full overflow-hidden rounded-[32px] p-[1px]"
        style={{
          background: featured
            ? `linear-gradient(145deg, ${t.primaryBorder}, rgba(255,255,255,0.08))`
            : `linear-gradient(145deg, ${t.borderStrong}, rgba(255,255,255,0.025))`,
          boxShadow: featured
            ? "0 36px 110px rgba(0,0,0,0.34), 0 0 80px rgba(74,222,128,0.08)"
            : "0 20px 70px rgba(0,0,0,0.16)",
          opacity: isPreviewOnly ? 0.82 : 1,
          filter: isPreviewOnly ? "saturate(0.82)" : undefined,
        }}
      >
        <div
          className="flex h-full min-h-0 flex-col rounded-[31px] p-5 sm:min-h-[520px] sm:p-6"
          style={{
            background: isPreviewOnly
              ? "linear-gradient(155deg, rgba(255,255,255,0.032), rgba(255,255,255,0.012))"
              : featured
                ? "linear-gradient(155deg, rgba(74,222,128,0.14), rgba(255,255,255,0.035) 42%, rgba(255,255,255,0.018))"
                : "linear-gradient(155deg, rgba(255,255,255,0.046), rgba(255,255,255,0.016))",
            backdropFilter: "blur(18px)",
          }}
        >
          <div className="mb-5 flex min-h-[28px] items-start justify-between gap-3">
            <div>
              {isPreviewOnly ? (
                <div
                  className="rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.08em]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: t.primary,
                  }}
                >
                  {PAID_PLANS_COMING_SOON_LABEL.toUpperCase()}
                </div>
              ) : (
                <div className="invisible rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.08em]">
                  placeholder
                </div>
              )}
            </div>

            <div>
              {featured ? (
                <div
                  className="rounded-full px-3 py-1 text-right font-mono text-[10px] tracking-[0.08em]"
                  style={{
                    background: t.primarySoft,
                    color: t.primary,
                  }}
                >
                  MOST POPULAR
                </div>
              ) : (
                <div className="invisible rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.08em]">
                  placeholder
                </div>
              )}
            </div>
          </div>

          <div className="mb-1 text-xl font-bold" style={{ color: t.text }}>
            {name}
          </div>

          <div
            className="mb-5 min-h-0 text-sm leading-6 sm:min-h-[42px]"
            style={{ color: t.muted }}
          >
            {sub}
          </div>

          <div className="mb-5 min-h-0">
            <div className="mb-2 flex min-h-[52px] items-end gap-2">
              <div
                className="text-[38px] leading-none sm:text-[42px]"
                style={{
                  color: t.text,
                  fontFamily: "'Instrument Serif', serif",
                }}
              >
                ${displayPrice}
              </div>

              {!isFree && (
                <div className="pb-1 text-sm" style={{ color: t.faint }}>
                  /{isYearly ? "yr" : "mo"}
                </div>
              )}
            </div>

            <div className="min-h-0">
              {isFree ? (
                <div className="text-xs" style={{ color: t.primary }}>
                  No credit card required
                </div>
              ) : isYearly ? (
                <div className="space-y-1.5">
                  <div className="flex min-h-[20px] items-center gap-2 text-sm">
                    <span className="line-through" style={{ color: t.faint }}>
                      ${monthly}/mo
                    </span>
                    <span className="font-semibold" style={{ color: t.primary }}>
                      ${equivalentMonthly}/mo equivalent
                    </span>
                  </div>

                  <div className="text-xs" style={{ color: t.primary }}>
                    Billed once yearly · save 17%
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-xs" style={{ color: t.primary }}>
                    or ${yearly}/year · billed once yearly · save 17%
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-7 grid min-h-0 gap-2.5">
            {points.map((point) => (
              <div key={point} className="flex items-start gap-2.5">
                <span style={{ color: t.primary }}>●</span>
                <span className="text-sm leading-6" style={{ color: t.textSoft }}>
                  {point}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto">
            {isPreviewOnly ? (
              <form className="space-y-3" onSubmit={handleJoinWaitlist}>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={waitlistEmail}
                  onChange={(event) => {
                    setWaitlistEmail(event.target.value);
                    if (waitlistState !== "idle") {
                      setWaitlistState("idle");
                      setWaitlistMessage(null);
                    }
                  }}
                  disabled={isJoiningWaitlist}
                  aria-label={`Email for ${name} launch waitlist`}
                  className="h-11 rounded-full border px-4 text-sm"
                  style={{
                    borderColor: t.border,
                    background: "rgba(255,255,255,0.04)",
                    color: t.text,
                  }}
                />

                <Button
                  type="submit"
                  disabled={isJoiningWaitlist}
                  className="w-full rounded-full font-semibold"
                  style={{
                    background: featured ? t.primarySoft : "rgba(255,255,255,0.055)",
                    color: t.text,
                  }}
                >
                  {isJoiningWaitlist ? "Saving..." : "Notify me when Pro launches"}
                </Button>

                <p className="text-center text-xs" style={{ color: t.faint }}>
                  Preview what Pro includes now. We&apos;ll send a confirmation email first so only real inboxes join the list.
                </p>

                {waitlistMessage && (
                  <p
                    className="text-center text-xs leading-5"
                    style={{
                      color: waitlistState === "success" ? t.primary : t.rose,
                    }}
                  >
                    {waitlistMessage}
                  </p>
                )}
              </form>
            ) : (
              <Button
                type="button"
                onClick={onChoosePlan}
                className="w-full rounded-full font-semibold"
                style={{
                  background: featured ? t.primary : t.text,
                  color: featured ? "#052e16" : t.bg,
                }}
              >
                {cta}
              </Button>
            )}
          </div>
        </div>
      </div>
    </m.div>
  );
}
