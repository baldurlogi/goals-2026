import { memo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

export const StepReading = memo(function StepReading({ data, onChange }: Props) {
  const goal = Number(data.daily_reading_goal) || 20;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[10, 15, 20, 25, 30, 50].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange({ daily_reading_goal: String(n) })}
            className={cn(
              "rounded-full border px-5 py-2 text-sm font-semibold transition-all",
              goal === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50",
            )}
          >
            {n} pages
          </button>
        ))}
      </div>
      <Input
        type="number"
        min="1"
        max="200"
        className="w-32"
        value={data.daily_reading_goal}
        onChange={(e) => onChange({ daily_reading_goal: e.target.value })}
      />
    </div>
  );
});
