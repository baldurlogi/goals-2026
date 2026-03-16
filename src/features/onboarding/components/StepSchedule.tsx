import { memo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleView } from "@/features/onboarding/profileStorage";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

const OPTIONS: { value: ScheduleView; label: string; sub: string; icon: string }[] = [
  { value: "wfh", label: "Work from home", sub: "No commute", icon: "🏠" },
  { value: "office", label: "Office day", sub: "Commute included", icon: "🏢" },
  { value: "weekend", label: "Weekend", sub: "Flexible", icon: "☀️" },
];

export const StepSchedule = memo(function StepSchedule({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange({ default_schedule_view: opt.value })}
          className={cn(
            "w-full rounded-xl border px-4 py-4 text-left transition-all",
            data.default_schedule_view === opt.value
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border hover:border-primary/40",
          )}
        >
          <div className="flex items-center gap-3">
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
            {data.default_schedule_view === opt.value ? <Check className="ml-auto h-4 w-4 text-primary" /> : null}
          </div>
        </button>
      ))}
    </div>
  );
});
