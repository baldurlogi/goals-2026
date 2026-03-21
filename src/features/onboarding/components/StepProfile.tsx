import { memo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Sex } from "@/features/onboarding/profileStorage";
import type { OnboardingData } from "./types";
import { validateClampedNumberInput } from "@/lib/numericInput";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

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
  const [ageError, setAgeError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);

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
          <div className="space-y-1">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Age (years)"
              value={data.age}
              onChange={(e) => {
                const result = validateClampedNumberInput(e.target.value, {
                  min: 1,
                  max: 100,
                });
                setAgeError(result.error);
                if (result.nextValue !== null) onChange({ age: result.nextValue });
              }}
              aria-invalid={!!ageError}
            />
            {ageError ? <p className="text-xs text-destructive">{ageError}</p> : null}
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Weight (kg)"
              value={data.weight_kg}
              onChange={(e) => {
                const result = validateClampedNumberInput(e.target.value, {
                  min: 1,
                  max: 300,
                  allowDecimal: true,
                });
                setWeightError(result.error);
                if (result.nextValue !== null) onChange({ weight_kg: result.nextValue });
              }}
              aria-invalid={!!weightError}
            />
            {weightError ? <p className="text-xs text-destructive">{weightError}</p> : null}
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Height (cm)"
              value={data.height_cm}
              onChange={(e) => {
                const result = validateClampedNumberInput(e.target.value, {
                  min: 1,
                  max: 220,
                  allowDecimal: true,
                });
                setHeightError(result.error);
                if (result.nextValue !== null) onChange({ height_cm: result.nextValue });
              }}
              aria-invalid={!!heightError}
            />
            {heightError ? <p className="text-xs text-destructive">{heightError}</p> : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Use metric units: weight in kilograms (kg) and height in centimeters (cm). Example: 72.5 kg and 178 cm.
        </p>
      </div>
    </div>
  );
});
