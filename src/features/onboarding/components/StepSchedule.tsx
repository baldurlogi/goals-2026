import { memo } from "react";
import {
  WEEKDAY_ORDER,
  type WeekdayKey,
  type WeeklyScheduleValue,
} from "@/features/onboarding/profileStorage";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

const DAY_LABELS: Record<WeekdayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const OPTIONS: { value: WeeklyScheduleValue; label: string; description: string }[] = [
  { value: "office", label: "Office", description: "Mostly in person" },
  { value: "wfh", label: "WFH", description: "Mostly remote" },
  { value: "hybrid", label: "Hybrid", description: "Mixed day" },
  { value: "off", label: "Off", description: "Day off" },
];

export const StepSchedule = memo(function StepSchedule({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">What does a normal week look like for you?</h2>
        <p className="text-sm text-muted-foreground">Set a default schedule for each weekday. You can edit this later in Profile.</p>
      </div>
      <div className="space-y-2">
        {WEEKDAY_ORDER.map((day) => (
          <div key={day} className="grid grid-cols-[minmax(0,1fr),auto] items-center gap-3 rounded-xl border bg-card px-3 py-3">
            <div>
              <p className="text-sm font-medium">{DAY_LABELS[day]}</p>
              <p className="text-xs text-muted-foreground">
                {OPTIONS.find((option) => option.value === data.weekly_schedule[day])?.description}
              </p>
            </div>
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={data.weekly_schedule[day]}
              onChange={(e) =>
                onChange({
                  weekly_schedule: {
                    ...data.weekly_schedule,
                    [day]: e.target.value as WeeklyScheduleValue,
                  },
                })
              }
            >
              {OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
});
