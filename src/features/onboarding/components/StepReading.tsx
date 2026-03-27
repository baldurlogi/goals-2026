import { memo, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OnboardingData } from "./types";

type Props = {
  data: OnboardingData;
  onChange: (p: Partial<OnboardingData>) => void;
};

const PRESET_OPTIONS = [10, 15, 20, 25, 30, 50] as const;

function clampGoal(value: number): number {
  return Math.max(1, Math.min(200, value));
}

function parseGoal(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? clampGoal(parsed) : 20;
}

export const StepReading = memo(function StepReading({
  data,
  onChange,
}: Props) {
  const [draftGoal, setDraftGoal] = useState(data.daily_reading_goal);
  const goal = parseGoal(data.daily_reading_goal);
  const isPreset = PRESET_OPTIONS.includes(goal as (typeof PRESET_OPTIONS)[number]);

  useEffect(() => {
    setDraftGoal(data.daily_reading_goal);
  }, [data.daily_reading_goal]);

  function setGoal(next: number) {
    const value = String(clampGoal(next));
    setDraftGoal(value);
    onChange({ daily_reading_goal: value });
  }

  function handleCustomChange(raw: string) {
    const digitsOnly = raw.replace(/[^\d]/g, "");
    setDraftGoal(digitsOnly);
  }

  function handleCustomBlur() {
    if (draftGoal === "") {
      const fallback = "20";
      setDraftGoal(fallback);
      onChange({ daily_reading_goal: fallback });
      return;
    }

    const normalized = String(clampGoal(Number(draftGoal)));
    setDraftGoal(normalized);
    onChange({ daily_reading_goal: normalized });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold">How much do you want to read each day?</h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Pick a realistic daily target. You can always change it later from
          Profile or Reading.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRESET_OPTIONS.map((n) => {
          const active = goal === n;

          return (
            <button
              key={n}
              type="button"
              onClick={() => setGoal(n)}
              className={cn(
                "rounded-xl border bg-card px-4 py-3 text-left transition-all",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40 hover:bg-accent/30",
              )}
            >
              <div
                className={cn(
                  "text-sm font-semibold",
                  active ? "text-foreground" : "text-foreground/90",
                )}
              >
                {n} pages
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Daily target
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-card/70 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label
                htmlFor="daily-reading-goal"
                className="text-sm font-semibold text-foreground"
              >
                Custom daily reading goal
              </label>
              {!isPreset && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  Custom
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Great if you want something more specific than the presets above.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setGoal(goal - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-lg font-semibold text-foreground transition-colors hover:bg-accent"
              aria-label="Decrease daily reading goal"
            >
              −
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <Input
                id="daily-reading-goal"
                type="text"
                inputMode="numeric"
                value={draftGoal}
                onChange={(e) => handleCustomChange(e.target.value)}
                onBlur={handleCustomBlur}
                className="h-9 w-16 border-0 bg-transparent p-0 text-center text-lg font-semibold tabular-nums shadow-none focus-visible:ring-0"
                aria-label="Daily reading goal"
              />
              <span className="text-sm text-muted-foreground">pages/day</span>
            </div>

            <button
              type="button"
              onClick={() => setGoal(goal + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-lg font-semibold text-foreground transition-colors hover:bg-accent"
              aria-label="Increase daily reading goal"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
