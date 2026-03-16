import { memo } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_LABELS,
  type ActivityLevel,
  type Sex,
} from "@/features/onboarding/profileStorage";
import type { OnboardingData } from "./types";

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
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50",
          )}
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
          <Input type="number" placeholder="Age" value={data.age} onChange={(e) => onChange({ age: e.target.value })} />
          <Input type="number" placeholder="Weight" value={data.weight_kg} onChange={(e) => onChange({ weight_kg: e.target.value })} />
          <Input type="number" placeholder="Height" value={data.height_cm} onChange={(e) => onChange({ height_cm: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Activity level</label>
          <div className="space-y-2">
            {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ activity_level: value })}
                className={cn(
                  "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                  data.activity_level === value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between">
                  {label}
                  {data.activity_level === value ? <Check className="h-4 w-4 text-primary" /> : null}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
