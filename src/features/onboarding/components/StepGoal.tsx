import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

export const StepGoal = memo(function StepGoal({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">What’s one big thing you want to achieve?</h2>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Main goal</label>
        <Input
          value={data.main_goal}
          onChange={(e) => onChange({ main_goal: e.target.value })}
          placeholder="Example: Run a half marathon in under 2 hours"
        />
        <p className="text-xs text-muted-foreground">Be specific about the outcome. Example: “Run a half marathon in under 2 hours” or “Read 24 books this year.”</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Why this matters (optional)</label>
        <Textarea
          value={data.goal_why}
          onChange={(e) => onChange({ goal_why: e.target.value })}
          placeholder="Example: I want more energy and consistency before summer."
          rows={4}
        />
      </div>
    </div>
  );
});
