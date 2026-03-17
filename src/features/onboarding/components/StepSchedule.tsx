import { memo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleView } from "@/features/onboarding/profileStorage";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

const OPTIONS: { value: ScheduleView; label: string; sub: string; icon: string }[] = [
  { value: "wfh", label: "Focus day", sub: "Minimal commuting, deep work blocks", icon: "🏠" },
  { value: "office", label: "Structured day", sub: "Commute and fixed-time blocks", icon: "🏢" },
  { value: "weekend", label: "Flexible day", sub: "Personal tasks and lighter structure", icon: "☀️" },
];

export const StepSchedule = memo(function StepSchedule({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Pick your default day style</h2>
        <p className="text-sm text-muted-foreground">This is just your starting view. You can switch day style anytime.</p>
      </div>
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
            <div>
              <p>{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.sub}</p>
            </div>
            {data.default_schedule_view === opt.value ? <Check className="ml-auto h-4 w-4 text-primary" /> : null}
          </div>
        </button>
      ))}
    </div>
  );
});
