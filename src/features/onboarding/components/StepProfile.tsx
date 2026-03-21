import { memo, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Sex } from "@/features/onboarding/profileStorage";
import type { OnboardingData } from "./types";
import { validateClampedNumberInput } from "@/lib/numericInput";
import {
  feetInchesToCm,
  lbsToKg,
  metricHeightToDisplay,
  metricWeightToDisplay,
} from "@/lib/userPreferences";

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
  const [imperialWeight, setImperialWeight] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");

  useEffect(() => {
    if (data.measurement_system !== "imperial") return;
    setImperialWeight(
      metricWeightToDisplay(data.measurement_system, data.weight_kg),
    );
    const nextHeight = metricHeightToDisplay(
      data.measurement_system,
      data.height_cm,
    );
    setHeightFeet(nextHeight.primary);
    setHeightInches(nextHeight.secondary);
  }, [
    data.height_cm,
    data.measurement_system,
    data.weight_kg,
  ]);

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
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Measurement system</label>
            <PillSelect
              options={[
                { value: "metric", label: "Metric" },
                { value: "imperial", label: "US / Imperial" },
              ]}
              value={data.measurement_system}
              onChange={(value) => onChange({ measurement_system: value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date format</label>
            <PillSelect
              options={[
                { value: "dmy", label: "DD/MM/YYYY" },
                { value: "mdy", label: "MM/DD/YYYY" },
              ]}
              value={data.date_format}
              onChange={(value) => onChange({ date_format: value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Time format</label>
            <PillSelect
              options={[
                { value: "24h", label: "24-hour" },
                { value: "12h", label: "12-hour" },
              ]}
              value={data.time_format}
              onChange={(value) => onChange({ time_format: value })}
            />
          </div>
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
              placeholder={
                data.measurement_system === "imperial" ? "Weight (lbs)" : "Weight (kg)"
              }
              value={
                data.measurement_system === "imperial"
                  ? imperialWeight
                  : data.weight_kg
              }
              onChange={(e) => {
                const result = validateClampedNumberInput(e.target.value, {
                  min: 1,
                  max: data.measurement_system === "imperial" ? 661 : 300,
                  allowDecimal: true,
                });
                setWeightError(result.error);
                if (result.nextValue === null) return;

                if (data.measurement_system === "imperial") {
                  setImperialWeight(result.nextValue);
                  onChange({
                    weight_kg:
                      result.nextValue === ""
                        ? ""
                        : String(Number(lbsToKg(Number(result.nextValue)).toFixed(1))),
                  });
                  return;
                }

                onChange({ weight_kg: result.nextValue });
              }}
              aria-invalid={!!weightError}
            />
            {weightError ? <p className="text-xs text-destructive">{weightError}</p> : null}
          </div>
          <div className="space-y-1">
            {data.measurement_system === "imperial" ? (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="ft"
                  value={heightFeet}
                  onChange={(e) => {
                    const result = validateClampedNumberInput(e.target.value, {
                      min: 0,
                      max: 8,
                    });
                    setHeightError(result.error);
                    if (result.nextValue === null) return;

                    setHeightFeet(result.nextValue);
                    const totalCm = feetInchesToCm(
                      Number(result.nextValue || "0"),
                      Number(heightInches || "0"),
                    );

                    if (totalCm > 220) {
                      setHeightError("This height needs to be 220 cm or lower.");
                      return;
                    }

                    onChange({
                      height_cm:
                        result.nextValue === "" && !heightInches
                          ? ""
                          : String(Number(totalCm.toFixed(1))),
                    });
                  }}
                  aria-invalid={!!heightError}
                />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="in"
                  value={heightInches}
                  onChange={(e) => {
                    const result = validateClampedNumberInput(e.target.value, {
                      min: 0,
                      max: 11,
                    });
                    setHeightError(result.error);
                    if (result.nextValue === null) return;

                    setHeightInches(result.nextValue);
                    const totalCm = feetInchesToCm(
                      Number(heightFeet || "0"),
                      Number(result.nextValue || "0"),
                    );

                    if (totalCm > 220) {
                      setHeightError("This height needs to be 220 cm or lower.");
                      return;
                    }

                    onChange({
                      height_cm:
                        !heightFeet && result.nextValue === ""
                          ? ""
                          : String(Number(totalCm.toFixed(1))),
                    });
                  }}
                  aria-invalid={!!heightError}
                />
              </div>
            ) : (
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
            )}
            {heightError ? <p className="text-xs text-destructive">{heightError}</p> : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {data.measurement_system === "imperial"
            ? "Use pounds and feet/inches if that feels more natural. We keep everything stored consistently behind the scenes."
            : "Use metric units: weight in kilograms (kg) and height in centimeters (cm). Example: 72.5 kg and 178 cm."}
        </p>
      </div>
    </div>
  );
});
