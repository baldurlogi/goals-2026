import { useMemo, useState, type ReactNode } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Dumbbell,
  CalendarDays,
  BookOpen,
  LayoutGrid,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/authContext";
import { captureOnce } from "@/lib/analytics";
import { completeOnboarding, calculateMacros } from "./profileStorage";
import { AddEditGoalModal } from "@/features/goals/components/AddEditGoalModal";
import { StepProfile } from "./components/StepProfile";
import { StepModules } from "./components/StepModules";
import { StepGoal } from "./components/StepGoal";
import { StepMacros } from "./components/StepMacros";
import { StepSchedule } from "./components/StepSchedule";
import { StepReading } from "./components/StepReading";
import {
  buildInitialAIPrompt,
  INITIAL_ONBOARDING_DATA,
  type OnboardingData,
} from "./components/types";

type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5;

const STEP_ICONS: Record<OnboardingStep, typeof User> = {
  0: User,
  1: LayoutGrid,
  2: Target,
  3: Dumbbell,
  4: CalendarDays,
  5: BookOpen,
};

const STEP_CONTENT: Record<OnboardingStep, { label: string; subtitle: string }> = {
  0: {
    label: "Profile",
    subtitle: "This helps us personalize recommendations right from the start.",
  },
  1: {
    label: "Modules",
    subtitle: "Picking modules keeps your workspace focused on what you care about.",
  },
  2: {
    label: "Goals",
    subtitle: "Clear goals turn intentions into a plan you can follow.",
  },
  3: {
    label: "Nutrition",
    subtitle: "Nutrition targets make healthy progress easier to measure.",
  },
  4: {
    label: "Schedule",
    subtitle: "A default schedule view reduces friction in daily planning.",
  },
  5: {
    label: "Reading",
    subtitle: "A daily reading target helps you build a consistent learning habit.",
  },
};

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { userId } = useAuth();
  const [step, setStep] = useState<OnboardingStep>(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"setup" | "goal">("setup");
  const [showGoalSkipConfirm, setShowGoalSkipConfirm] = useState(false);

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  const visibleSteps = useMemo(
    () =>
      ([0, 1, 2, 3, 4, 5] as OnboardingStep[]).filter((s) => {
        if (s === 3) return data.enabled_modules.includes("nutrition");
        if (s === 4) return data.enabled_modules.includes("schedule");
        if (s === 5) return data.enabled_modules.includes("reading");
        return true;
      }),
    [data.enabled_modules],
  );

  const currentIndex = visibleSteps.indexOf(step);
  const isLastStep = currentIndex === visibleSteps.length - 1;
  const currentStepContent = STEP_CONTENT[step];

  function canAdvance(): boolean {
    if (step === 0) return !!data.display_name.trim();
    if (step === 1) return data.enabled_modules.length > 0;
    return true;
  }

  function goNext() {
    const i = currentIndex + 1;
    if (i < visibleSteps.length) setStep(visibleSteps[i]);
  }

  function goBack() {
    const i = currentIndex - 1;
    if (i >= 0) setStep(visibleSteps[i]);
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);

    try {
      const calculated =
        data.weight_kg && data.height_cm && data.age
          ? calculateMacros(
              Number(data.weight_kg),
              Number(data.height_cm),
              Number(data.age),
              data.sex,
              data.activity_level,
            )
          : null;

      await completeOnboarding({
        display_name: data.display_name.trim(),
        sex: data.sex,
        age: data.age ? Number(data.age) : null,
        weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
        height_cm: data.height_cm ? Number(data.height_cm) : null,
        activity_level: data.activity_level,
        macro_maintain: data.macro_maintain ?? calculated?.maintain ?? null,
        macro_cut: data.macro_cut ?? calculated?.cut ?? null,
        default_schedule_view: data.default_schedule_view,
        daily_reading_goal: Number(data.daily_reading_goal) || 20,
        enabled_modules: data.enabled_modules,
      });

      captureOnce("onboarding_completed", userId, {
        enabled_modules_count: data.enabled_modules.length,
        has_main_goal_intent: Boolean(data.main_goal.trim()),
        source: "onboarding_flow",
        route: "/app",
      });

      if (data.main_goal.trim()) {
        setPhase("goal");
        return;
      }

      onComplete();
    } catch (e) {
      setError("Something went wrong saving your profile. Please try again.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (phase === "goal") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        {showGoalSkipConfirm ? (
          <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-5 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Skip goal setup for now?</h2>
              <p className="text-sm text-muted-foreground">
                You can always create or edit goals later from your dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setShowGoalSkipConfirm(false)}>
                Continue setup
              </Button>
              <Button type="button" onClick={onComplete}>
                Skip for now
              </Button>
            </div>
          </div>
        ) : (
          <AddEditGoalModal
            onSave={() => onComplete()}
            onClose={() => setShowGoalSkipConfirm(true)}
            startWithAI
            initialAIPrompt={buildInitialAIPrompt(data.main_goal, data.goal_why)}
          />
        )}
      </div>
    );
  }

  const stepComponents: Record<OnboardingStep, ReactNode> = {
    0: <StepProfile data={data} onChange={update} />,
    1: <StepModules data={data} onChange={update} />,
    2: <StepGoal data={data} onChange={update} />,
    3: <StepMacros data={data} onChange={update} />,
    4: <StepSchedule data={data} onChange={update} />,
    5: <StepReading data={data} onChange={update} />,
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {visibleSteps.map((s, i) => {
              const Icon = STEP_ICONS[s];
              const done = i < currentIndex;
              const active = s === step;
              const stepContent = STEP_CONTENT[s];

              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                        done && "border-primary bg-primary text-primary-foreground",
                        active && "border-primary bg-primary/10 text-primary",
                        !done && !active && "border-muted-foreground/30 text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                    </div>
                    <div className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>{stepContent.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Step {currentIndex + 1} of {visibleSteps.length}: {currentStepContent.label}
          </p>
          <p className="text-sm text-muted-foreground">{currentStepContent.subtitle}</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">{stepComponents[step]}</div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={goBack} disabled={currentIndex <= 0 || saving} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button type="button" onClick={() => void handleFinish()} disabled={!canAdvance() || saving} className="gap-2">
              {saving ? "Saving…" : data.main_goal.trim() ? "Continue with AI" : "Finish"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={goNext} disabled={!canAdvance() || saving} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
