import { memo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

export const StepReading = memo(function StepReading({ data, onChange }: Props) {
  const goal = Number(data.daily_reading_goal) || 20;
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">How much do you want to read each day?</h2>
        <p className="text-sm text-muted-foreground">Choose a simple pages goal now. You can fine-tune it later from Profile or Reading.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[10, 15, 20, 25, 30, 50].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange({ daily_reading_goal: String(n) })}
            className={cn(
              "rounded-xl border bg-card px-4 py-3 text-left text-sm font-semibold transition-all",
              goal === n
                ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20"
                : "border-border text-muted-foreground hover:border-primary/50",
            )}
          >
            <div>{n} pages</div>
            <div className="mt-1 text-xs font-normal text-muted-foreground">Daily target</div>
          </button>
        ))}
      </div>
      <div className="space-y-2 rounded-xl border bg-card p-4">
        <label className="text-sm font-medium" htmlFor="daily-reading-goal">Custom daily reading goal</label>
        <Input
          id="daily-reading-goal"
          type="number"
          min="1"
          max="200"
          className="w-32"
          value={data.daily_reading_goal}
          onChange={(e) => onChange({ daily_reading_goal: e.target.value })}
        />
      </div>
    </div>
  );
});
