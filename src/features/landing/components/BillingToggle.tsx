import { Button } from "@/components/ui/button";
import { TOKENS } from "../theme/tokens";
import type { BillingMode, ThemeMode } from "../types";

type BillingToggleProps = {
  billing: BillingMode;
  setBilling: (billing: BillingMode) => void;
  theme: ThemeMode;
};

export function BillingToggle({
  billing,
  setBilling,
  theme,
}: BillingToggleProps) {
  const t = TOKENS[theme];

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border p-1"
      style={{
        background: t.surface,
        borderColor: t.border,
      }}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={() => setBilling("monthly")}
        className="rounded-full px-4 py-2 text-sm font-semibold"
        style={{
          background: billing === "monthly" ? t.primarySoft : "transparent",
          color: billing === "monthly" ? t.primary : t.muted,
          border:
            billing === "monthly"
              ? `1px solid ${t.primaryBorder}`
              : "1px solid transparent",
        }}
      >
        Monthly
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setBilling("yearly")}
        className="rounded-full px-4 py-2 text-sm font-semibold"
        style={{
          background: billing === "yearly" ? t.primarySoft : "transparent",
          color: billing === "yearly" ? t.primary : t.muted,
          border:
            billing === "yearly"
              ? `1px solid ${t.primaryBorder}`
              : "1px solid transparent",
        }}
      >
        Yearly · billed once · save 17%
      </Button>
    </div>
  );
}