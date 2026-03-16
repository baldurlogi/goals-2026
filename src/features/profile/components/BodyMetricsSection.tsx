import { memo } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_LABELS,
  type ActivityLevel,
} from "@/features/onboarding/profileStorage";

type Props = {
  age: string;
  weightKg: string;
  heightCm: string;
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
  activityLevel,
  onAgeChange,
  onWeightChange,
  onHeightChange,
  onActivityLevelChange,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Age</label>
          <Input type="number" min="10" max="100" value={age} onChange={(e) => onAgeChange(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Weight (kg)</label>
          <Input
            type="number"
            min="30"
            max="300"
            value={weightKg}
            onChange={(e) => onWeightChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Height (cm)</label>
          <Input
            type="number"
            min="100"
            max="250"
            value={heightCm}
            onChange={(e) => onHeightChange(e.target.value)}
          />
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
