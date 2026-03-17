import { memo } from "react";
import { Input } from "@/components/ui/input";
import type { Sex } from "@/features/onboarding/profileStorage";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

function sanitizeNumberInput(value: string) {
  if (!value) return "";
  return /^\d*(?:\.\d{0,1})?$/.test(value) ? value : null;
}

function PillSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="rounded-full border border-border bg-muted/40 px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/50 data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
          data-active={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const StepProfile = memo(function StepProfile({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Tell us about yourself</h2>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Your name</label>
          <Input value={data.display_name} onChange={(e) => onChange({ display_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Sex</label>
          <PillSelect
            options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]}
            value={data.sex as Sex}
            onChange={(v) => onChange({ sex: v })}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Age (years)"
            value={data.age}
            onChange={(e) => {
              const next = /^\d*$/.test(e.target.value) ? e.target.value : null;
              if (next !== null) onChange({ age: next });
            }}
          />
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Weight (kg)"
            value={data.weight_kg}
            onChange={(e) => {
              const next = sanitizeNumberInput(e.target.value);
              if (next !== null) onChange({ weight_kg: next });
            }}
          />
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Height (cm)"
            value={data.height_cm}
            onChange={(e) => {
              const next = sanitizeNumberInput(e.target.value);
              if (next !== null) onChange({ height_cm: next });
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Use metric units: weight in kilograms (kg) and height in centimeters (cm).
        </p>
      </div>
    </div>
  );
});
