import { memo, useState } from "react";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepGoal } from "./StepGoal";
import { AIPromptScreen } from "@/features/goals/components/AIPromptScreen";
import type { UserGoal } from "@/features/goals/goalTypes";
import {
  buildInitialAIPrompt,
  type OnboardingData,
} from "./types";

type Props = {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  generatedGoal: UserGoal | null;
  onGoalGenerated: (goal: UserGoal) => void;
};

export const StepGoalPlanner = memo(function StepGoalPlanner({
  data,
  onChange,
  generatedGoal,
  onGoalGenerated,
}: Props) {
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const initialPrompt = buildInitialAIPrompt(data.main_goal, data.goal_why);

  if (showAIGenerator) {
    return (
      <AIPromptScreen
        key={initialPrompt}
        initialPrompt={initialPrompt}
        autoStart={Boolean(initialPrompt.trim())}
        onGenerated={(goal) => {
          onGoalGenerated(goal);
          setShowAIGenerator(false);
        }}
        onBack={() => setShowAIGenerator(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StepGoal data={data} onChange={onChange} />

      {generatedGoal ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Your first goal plan is ready
                </p>
                <p className="text-sm text-muted-foreground">
                  This is the kind of plan Begyn will keep helping you act on.
                </p>
              </div>

              <div className="rounded-xl border bg-background px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  {generatedGoal.emoji} {generatedGoal.title}
                </p>
                {generatedGoal.subtitle ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {generatedGoal.subtitle}
                  </p>
                ) : null}

                <div className="mt-3 space-y-2">
                  {generatedGoal.steps.slice(0, 3).map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {index + 1}
                      </div>
                      <span className="text-foreground/90">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
          <p className="text-sm font-medium text-foreground">
            The first big value moment happens here.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Describe one thing you want to achieve and Begyn will turn it into a
            step-by-step plan you can actually start.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {generatedGoal ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAIGenerator(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Regenerate with AI
          </Button>
        ) : null}

        <Button
          type="button"
          onClick={() => setShowAIGenerator(true)}
          disabled={!data.main_goal.trim()}
          className="gap-2 bg-violet-600 text-white hover:bg-violet-500 hover:text-white"
        >
          <Sparkles className="h-4 w-4" />
          {generatedGoal ? "Update goal plan" : "Generate goal with AI"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
