import { useMemo, useState, type ReactNode, useEffect } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  Dumbbell,
  CalendarDays,
  BookOpen,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/authContext";
import { captureOnce } from "@/lib/analytics";
import { completeOnboarding } from "./profileStorage";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { StepProfile } from "./components/StepProfile";
import { StepModules } from "./components/StepModules";
import { StepMacros } from "./components/StepMacros";
import { StepSchedule } from "./components/StepSchedule";
import { StepReading } from "./components/StepReading";
import {
  INITIAL_ONBOARDING_DATA,
  type OnboardingData,
} from "./components/types";

type OnboardingStep = 0 | 1 | 2 | 3 | 4;

const STEP_ICONS: Record<OnboardingStep, typeof User> = {
  0: User,
  1: LayoutGrid,
  2: Dumbbell,
  3: CalendarDays,
  4: BookOpen,
};

const STEP_CONTENT: Record<OnboardingStep, { label: string; subtitle: string }> =
  {
    0: {
      label: "Profile",
      subtitle: "This helps us personalize recommendations right from the start.",
    },
    1: {
      label: "Modules",
      subtitle:
        "Pick only the parts of the app you actually want to use right now.",
    },
    2: {
      label: "Nutrition",
      subtitle:
        "Enter your own targets or answer a few questions to get a smarter suggestion.",
    },
    3: {
      label: "Schedule",
      subtitle: "Set your weekly defaults once so daily planning matches real life.",
    },
    4: {
      label: "Reading",
      subtitle: "A daily reading target helps you build a consistent learning habit.",
    },
  };

function hasValidNutritionTarget(data: OnboardingData) {
  return Boolean(
    data.macro_maintain &&
      data.macro_maintain.cal > 0 &&
      data.macro_maintain.protein > 0 &&
      data.macro_maintain.fat > 0,
  );
}

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { userId } = useAuth();
  const [step, setStep] = useState<OnboardingStep>(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    captureOnce("onboarding_started", userId, {
      source: "onboarding_flow",
      route: "/app",
    });
  }, [userId]);

  function update(patch: Partial<OnboardingData>) {
    setError(null);
    setData((prev) => ({ ...prev, ...patch }));
  }

  const visibleSteps = useMemo(
    () =>
      ([0, 1, 2, 3, 4] as OnboardingStep[]).filter((s) => {
        if (s === 2) return data.enabled_modules.includes("nutrition");
        if (s === 3) return data.enabled_modules.includes("schedule");
        if (s === 4) return data.enabled_modules.includes("reading");
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
    if (step === 2) return hasValidNutritionTarget(data);
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
      await completeOnboarding({
        display_name: data.display_name.trim(),
        sex: data.sex,
        age: data.age ? Number(data.age) : null,
        weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
        height_cm: data.height_cm ? Number(data.height_cm) : null,
        activity_level: data.activity_level,
        macro_maintain: hasValidNutritionTarget(data) ? data.macro_maintain : null,
        macro_cut: data.macro_cut ?? null,
        weekly_schedule: data.weekly_schedule,
        daily_reading_goal: Number(data.daily_reading_goal) || 20,
        enabled_modules: data.enabled_modules,
      });

      captureOnce("onboarding_completed", userId, {
        enabled_modules_count: data.enabled_modules.length,
        has_nutrition_target: hasValidNutritionTarget(data),
        nutrition_setup_mode: data.macro_setup_mode,
        source: "onboarding_flow",
        route: "/app",
      });

      onComplete();
    } catch (e) {
      setError(
        "We couldn't finish setup yet. Please retry — your answers are still here.",
      );
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const stepComponents: Record<OnboardingStep, ReactNode> = {
    0: <StepProfile data={data} onChange={update} />,
    1: <StepModules data={data} onChange={update} />,
    2: <StepMacros data={data} onChange={update} />,
    3: <StepSchedule data={data} onChange={update} />,
    4: <StepReading data={data} onChange={update} />,
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {visibleSteps.map((s, i) => {
              const Icon = STEP_ICONS[s];
              const done = i < currentIndex;
              const active = s === step;
              const stepContent = STEP_CONTENT[s];

              return (
                <div
                  key={s}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-2 transition-all",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                      done && "border-primary bg-primary text-primary-foreground",
                      active && "border-primary bg-primary/10 text-primary",
                      !done &&
                        !active &&
                        "border-muted-foreground/30 text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "text-xs font-medium",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {stepContent.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Step {currentIndex + 1} of {visibleSteps.length}:{" "}
              {currentStepContent.label}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentStepContent.subtitle}
            </p>
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-6 sm:p-7">
            {stepComponents[step]}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-dashed bg-muted/20 py-4 shadow-none">
          <CardContent className="space-y-2 pt-0 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-foreground">Save status</p>
              <span
                className={cn(
                  "text-xs",
                  saving ? "text-primary" : "text-muted-foreground",
                )}
              >
                {saving
                  ? "Saving your onboarding details…"
                  : "Everything is saved together when you finish setup."}
              </span>
            </div>
            <p className="text-muted-foreground">
              After setup, your dashboard will open with your profile and selected
              modules ready. Your first goal can be created from the dashboard when
              you are ready.
            </p>
            {error ? (
              <p className="text-sm font-medium text-destructive">{error}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={currentIndex <= 0 || saving}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={() => void handleFinish()}
              disabled={!canAdvance() || saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Finish to dashboard
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!canAdvance() || saving}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}