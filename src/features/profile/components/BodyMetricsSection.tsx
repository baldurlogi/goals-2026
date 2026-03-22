import { memo, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { validateClampedNumberInput } from "@/lib/numericInput";
import {
  ACTIVITY_LABELS,
  type ActivityLevel,
} from "@/features/onboarding/profileStorage";
import {
  feetInchesToCm,
  lbsToKg,
  metricHeightToDisplay,
  metricWeightToDisplay,
  type MeasurementSystem,
} from "@/lib/userPreferences";

type Props = {
  age: string;
  weightKg: string;
  heightCm: string;
  measurementSystem: MeasurementSystem;
  activityLevel: ActivityLevel;
  onAgeChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onActivityLevelChange: (value: ActivityLevel) => void;
};

export const BodyMetricsSection = memo(function BodyMetricsSection({
  age,
  weightKg,
  heightCm,
  measurementSystem,
  activityLevel,
  onAgeChange,
  onWeightChange,
  onHeightChange,
  onActivityLevelChange,
}: Props) {
  const [ageError, setAgeError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [imperialWeight, setImperialWeight] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");

  useEffect(() => {
    if (measurementSystem !== "imperial") return;
    setImperialWeight(metricWeightToDisplay(measurementSystem, weightKg));
    const nextHeight = metricHeightToDisplay(measurementSystem, heightCm);
    setHeightFeet(nextHeight.primary);
    setHeightInches(nextHeight.secondary);
  }, [heightCm, measurementSystem, weightKg]);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Age</label>
          <Input
            type="text"
            inputMode="numeric"
            value={age}
            onChange={(e) => {
              const result = validateClampedNumberInput(e.target.value, {
                min: 1,
                max: 100,
              });
              setAgeError(result.error);
              if (result.nextValue !== null) onAgeChange(result.nextValue);
            }}
            aria-invalid={!!ageError}
          />
          {ageError ? <p className="text-xs text-destructive">{ageError}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Weight ({measurementSystem === "imperial" ? "lbs" : "kg"})
          </label>
          <Input
            type="text"
            inputMode="decimal"
            value={measurementSystem === "imperial" ? imperialWeight : weightKg}
            onChange={(e) => {
              const result = validateClampedNumberInput(e.target.value, {
                min: 1,
                max: measurementSystem === "imperial" ? 661 : 300,
                allowDecimal: true,
              });
              setWeightError(result.error);
              if (result.nextValue === null) return;

              if (measurementSystem === "imperial") {
                setImperialWeight(result.nextValue);
                onWeightChange(
                  result.nextValue === ""
                    ? ""
                    : String(Number(lbsToKg(Number(result.nextValue)).toFixed(1))),
                );
                return;
              }

              onWeightChange(result.nextValue);
            }}
            aria-invalid={!!weightError}
          />
          {weightError ? <p className="text-xs text-destructive">{weightError}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Height ({measurementSystem === "imperial" ? "ft / in" : "cm"})
          </label>
          {measurementSystem === "imperial" ? (
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
                  const feet = Number(result.nextValue || "0");
                  const inches = Number(heightInches || "0");
                  const totalCm = feetInchesToCm(feet, inches);

                  if (totalCm > 220) {
                    setHeightError("This height needs to be 220 cm or lower.");
                    return;
                  }

                  onHeightChange(
                    result.nextValue === "" && !heightInches
                      ? ""
                      : String(Number(totalCm.toFixed(1))),
                  );
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
                  const feet = Number(heightFeet || "0");
                  const inches = Number(result.nextValue || "0");
                  const totalCm = feetInchesToCm(feet, inches);

                  if (totalCm > 220) {
                    setHeightError("This height needs to be 220 cm or lower.");
                    return;
                  }

                  onHeightChange(
                    !heightFeet && result.nextValue === ""
                      ? ""
                      : String(Number(totalCm.toFixed(1))),
                  );
                }}
                aria-invalid={!!heightError}
              />
            </div>
          ) : (
            <Input
              type="text"
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => {
                const result = validateClampedNumberInput(e.target.value, {
                  min: 1,
                  max: 220,
                  allowDecimal: true,
                });
                setHeightError(result.error);
                if (result.nextValue !== null) onHeightChange(result.nextValue);
              }}
              aria-invalid={!!heightError}
            />
          )}
          {heightError ? <p className="text-xs text-destructive">{heightError}</p> : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Activity level</label>
        <div className="space-y-2">
          {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onActivityLevelChange(value)}
              className={cn(
                "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                activityLevel === value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{label}</span>
                {activityLevel === value && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
});
