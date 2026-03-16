import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

export const StepGoal = memo(function StepGoal({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">What’s one big thing you want to achieve?</h2>
      <Input value={data.main_goal} onChange={(e) => onChange({ main_goal: e.target.value })} />
      <Textarea value={data.goal_why} onChange={(e) => onChange({ goal_why: e.target.value })} rows={4} />
    </div>
  );
});
