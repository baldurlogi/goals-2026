import { useMemo, useState, type ReactNode } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    subtitle: "Set activity and macros using AI suggestions or manual targets.",
  },
  4: {
    label: "Schedule",
    subtitle: "Set your weekly defaults once so daily planning matches real life.",
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
    setError(null);
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
  const hasGoalIntent = Boolean(data.main_goal.trim());

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
        weekly_schedule: data.weekly_schedule,
        daily_reading_goal: Number(data.daily_reading_goal) || 20,
        enabled_modules: data.enabled_modules,
      });

      captureOnce("onboarding_completed", userId, {
        enabled_modules_count: data.enabled_modules.length,
        has_main_goal_intent: hasGoalIntent,
        source: "onboarding_flow",
        route: "/app",
      });

      if (hasGoalIntent) {
        setPhase("goal");
        return;
      }

      onComplete();
    } catch (e) {
      setError("We saved nothing yet. Please retry and we'll keep your current answers in place.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (phase === "goal") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        {showGoalSkipConfirm ? (
          <Card className="w-full max-w-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Skip goal setup for now?</CardTitle>
              <CardDescription>
                Your onboarding details are already saved. You can always create or edit goals later from the Goals tab in your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setShowGoalSkipConfirm(false)}>
                Continue setup
              </Button>
              <Button type="button" onClick={onComplete}>
                Open dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full max-w-3xl space-y-4">
            <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Onboarding saved. Next up: goal setup.
                  </CardTitle>
                  <CardDescription>
                    We'll use your goal idea to draft a stronger starting point. You can still skip this and finish inside the dashboard.
                  </CardDescription>
                </div>
                <div className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  Step 2 of 2
                </div>
              </CardHeader>
            </Card>
            <AddEditGoalModal
              onSave={() => onComplete()}
              onClose={() => setShowGoalSkipConfirm(true)}
              startWithAI
              initialAIPrompt={buildInitialAIPrompt(data.main_goal, data.goal_why)}
            />
          </div>
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
      <div className="w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <div className="-mx-1 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
            {visibleSteps.map((s, i) => {
              const Icon = STEP_ICONS[s];
              const done = i < currentIndex;
              const active = s === step;
              const stepContent = STEP_CONTENT[s];

              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="flex snap-start items-center gap-2 rounded-full border border-transparent px-2 py-1">
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

        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Step {currentIndex + 1} of {visibleSteps.length}: {currentStepContent.label}
          </p>
          <p className="text-sm text-muted-foreground">{currentStepContent.subtitle}</p>
        </div>

        <Card className="max-h-[min(70vh,720px)] overflow-y-auto rounded-2xl overscroll-contain">
          <CardContent className="space-y-4 pt-6">{stepComponents[step]}</CardContent>
        </Card>

        <Card className="rounded-2xl border-dashed bg-muted/20 py-4 shadow-none">
          <CardContent className="space-y-2 text-sm pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-foreground">Save status</p>
              <span className={cn("text-xs", saving ? "text-primary" : "text-muted-foreground")}>
                {saving ? "Saving your onboarding details…" : "Nothing is saved until you finish this step flow."}
              </span>
            </div>
            <p className="text-muted-foreground">
              After setup, your dashboard will open with your goal state ready. You can review or edit everything later in <span className="font-medium text-foreground">Goals</span> and <span className="font-medium text-foreground">Profile</span>.
            </p>
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={goBack} disabled={currentIndex <= 0 || saving} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button type="button" onClick={() => void handleFinish()} disabled={!canAdvance() || saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : hasGoalIntent ? (
                <>
                  Continue to goal setup
                  <Sparkles className="h-4 w-4" />
                </>
              ) : (
                <>
                  Finish to dashboard
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
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
