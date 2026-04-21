import { memo, useMemo, useState } from "react";
import { Check, PencilLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { validateClampedNumberInput } from "@/lib/numericInput";
import {
  ACTIVITY_LABELS,
  calculateTDEE,
  type ActivityLevel,
  type MacroTargets,
} from "@/features/onboarding/profileStorage";
import type {
  GoalPace,
  MacroSetupMode,
  NutritionGoalType,
  OnboardingData,
  TrainingFocus,
} from "./types";

type Props = {
  data: OnboardingData;
  onChange: (p: Partial<OnboardingData>) => void;
};

const GOAL_OPTIONS: Array<{
  value: NutritionGoalType;
  label: string;
  helper: string;
}> = [
  {
    value: "fat_loss",
    label: "Fat loss",
    helper: "Lose body fat while keeping as much muscle and performance as possible.",
  },
  {
    value: "maintain",
    label: "Maintain",
    helper: "Keep body weight and performance stable while eating consistently.",
  },
  {
    value: "recomp",
    label: "Recomp",
    helper: "Try to improve body composition without a hard bulk or hard cut.",
  },
  {
    value: "muscle_gain",
    label: "Build muscle",
    helper: "Lean bulk with enough fuel for training and recovery.",
  },
  {
    value: "performance",
    label: "Performance",
    helper: "Fuel lifting, running, or endurance performance first.",
  },
  {
    value: "custom",
    label: "Custom",
    helper: "Describe your own goal and we will build a smarter starting point.",
  },
];

const TRAINING_OPTIONS: Array<{
  value: TrainingFocus;
  label: string;
}> = [
  { value: "lifting", label: "Mostly lifting" },
  { value: "mixed", label: "Mixed training" },
  { value: "endurance", label: "Mostly endurance" },
];

const PACE_OPTIONS: Array<{
  value: GoalPace;
  label: string;
  helper: string;
}> = [
  { value: "gentle", label: "Gentle", helper: "More sustainable, smaller changes." },
  { value: "moderate", label: "Moderate", helper: "Balanced default for most people." },
  { value: "aggressive", label: "Aggressive", helper: "Faster change, harder to sustain." },
];

function emptyTargets(): MacroTargets {
  return { cal: 0, protein: 0, carbs: 0, fat: 0 };
}

function roundToFive(value: number) {
  return Math.max(0, Math.round(value / 5) * 5);
}

function caloriesFromMacros(targets: MacroTargets) {
  return targets.protein * 4 + targets.carbs * 4 + targets.fat * 9;
}

function inferGoalFromText(text: string): Exclude<NutritionGoalType, "custom"> {
  const lower = text.toLowerCase();

  if (
    lower.includes("cut") ||
    lower.includes("lose fat") ||
    lower.includes("fat loss") ||
    lower.includes("get lean")
  ) {
    return "fat_loss";
  }

  if (
    lower.includes("bulk") ||
    lower.includes("gain muscle") ||
    lower.includes("build muscle") ||
    lower.includes("lean bulk")
  ) {
    return "muscle_gain";
  }

  if (lower.includes("recomp") || lower.includes("recomposition")) {
    return "recomp";
  }

  if (
    lower.includes("marathon") ||
    lower.includes("half marathon") ||
    lower.includes("race") ||
    lower.includes("endurance") ||
    lower.includes("performance")
  ) {
    return "performance";
  }

  return "maintain";
}

function getEffectiveGoalType(data: OnboardingData): Exclude<NutritionGoalType, "custom"> {
  if (data.nutrition_goal_type !== "custom") {
    return data.nutrition_goal_type;
  }

  const combinedText = `${data.nutrition_goal_text} ${data.main_goal}`.trim();
  if (!combinedText) return "maintain";

  return inferGoalFromText(combinedText);
}

function buildSmartSuggestion(data: OnboardingData): {
  target: MacroTargets;
  rationale: string;
} | null {
  const weight = Number(data.weight_kg);
  const height = Number(data.height_cm);
  const age = Number(data.age);

  if (!weight || !height || !age) {
    return null;
  }

  const rawMaintenanceFromUser = Number(data.known_maintenance_calories);
  const maintenanceFromUser =
    Number.isFinite(rawMaintenanceFromUser) && rawMaintenanceFromUser >= 1000
      ? rawMaintenanceFromUser
      : 0;
  const baseCalories =
    maintenanceFromUser > 0
      ? maintenanceFromUser
      : calculateTDEE(weight, height, age, data.sex, data.activity_level);

  const effectiveGoalType = getEffectiveGoalType(data);
  const paceFactor =
    data.goal_pace === "gentle"
      ? 0.75
      : data.goal_pace === "aggressive"
        ? 1.2
        : 1;

  let calorieAdjustment = 0;

  switch (effectiveGoalType) {
    case "fat_loss":
      calorieAdjustment = -400;
      break;
    case "maintain":
      calorieAdjustment = 0;
      break;
    case "recomp":
      calorieAdjustment = data.training_focus === "lifting" ? -100 : -150;
      break;
    case "muscle_gain":
      calorieAdjustment = 250;
      break;
    case "performance":
      calorieAdjustment = data.training_focus === "endurance" ? 300 : 180;
      break;
  }

  calorieAdjustment = Math.round(calorieAdjustment * paceFactor);

  if (effectiveGoalType === "performance" && data.training_focus === "endurance") {
    calorieAdjustment += 100;
  }

  const calories = roundToFive(baseCalories + calorieAdjustment);

  let proteinMultiplier = 2;

  switch (effectiveGoalType) {
    case "fat_loss":
      proteinMultiplier = 2.2;
      break;
    case "maintain":
      proteinMultiplier = 1.9;
      break;
    case "recomp":
      proteinMultiplier = 2.2;
      break;
    case "muscle_gain":
      proteinMultiplier = 2;
      break;
    case "performance":
      proteinMultiplier = data.training_focus === "endurance" ? 1.8 : 2;
      break;
  }

  if (data.training_focus === "lifting" && effectiveGoalType !== "performance") {
    proteinMultiplier += 0.05;
  }

  const protein = roundToFive(weight * proteinMultiplier);

  let fatRatio = 0.27;
  if (effectiveGoalType === "performance") fatRatio = 0.24;
  if (effectiveGoalType === "fat_loss" && data.goal_pace === "aggressive") fatRatio = 0.25;

  const fat = roundToFive((calories * fatRatio) / 9);
  const carbs = roundToFive(
    Math.max(0, (calories - protein * 4 - fat * 9) / 4),
  );

  const goalLabel =
    GOAL_OPTIONS.find((option) => option.value === data.nutrition_goal_type)?.label ??
    "goal";

  const rationaleParts = [
    maintenanceFromUser > 0
      ? `using your stated maintenance of ${maintenanceFromUser} kcal`
      : `based on your body data and activity level`,
    `with a ${goalLabel.toLowerCase()} focus`,
    `${data.training_focus} training`,
    `${data.goal_pace} pace`,
  ];

  return {
    target: { cal: calories, protein, carbs, fat },
    rationale: `Suggested as a starting point ${rationaleParts.join(", ")}.`,
  };
}

function MacroEditor({
  targets,
  onChange,
}: {
  targets: MacroTargets;
  onChange: (t: MacroTargets) => void;
}) {
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof MacroTargets, string | null>>
  >({});

  const fields: Array<{ key: keyof MacroTargets; label: string; suffix: string }> = [
    { key: "cal", label: "Calories", suffix: "kcal" },
    { key: "protein", label: "Protein", suffix: "g" },
    { key: "carbs", label: "Carbs", suffix: "g" },
    { key: "fat", label: "Fat", suffix: "g" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {field.label}
          </label>
          <Input
            type="text"
            inputMode="numeric"
            value={targets[field.key] > 0 ? targets[field.key] : ""}
            onChange={(e) => {
              const result = validateClampedNumberInput(e.target.value, {
                min: 0,
                max: field.key === "cal" ? 10000 : 1000,
              });
              setFieldErrors((prev) => ({
                ...prev,
                [field.key]: result.error,
              }));
              if (result.nextValue === null) return;
              onChange({
                ...targets,
                [field.key]: result.nextValue === "" ? 0 : Number(result.nextValue),
              });
            }}
            aria-invalid={!!fieldErrors[field.key]}
            aria-label={field.label}
            placeholder={field.label}
          />
          {fieldErrors[field.key] ? (
            <p className="text-[11px] text-destructive">{fieldErrors[field.key]}</p>
          ) : null}
          <p className="text-[11px] text-muted-foreground">{field.suffix}</p>
        </div>
      ))}
    </div>
  );
}

function SetupModeButton({
  active,
  title,
  body,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  body: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          <span>{title}</span>
        </div>
        {active ? <Check className="h-4 w-4 text-primary" /> : null}
      </div>
      <p className="text-sm text-muted-foreground">{body}</p>
    </button>
  );
}

function TargetPreview({
  title,
  description,
  targets,
}: {
  title: string;
  description: string;
  targets: MacroTargets;
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="text-2xl font-bold">{targets.cal} kcal</div>
      <div className="text-sm text-muted-foreground">
        P {targets.protein}g • C {targets.carbs}g • F {targets.fat}g
      </div>
    </div>
  );
}

export const StepMacros = memo(function StepMacros({ data, onChange }: Props) {
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const currentTargets = data.macro_maintain ?? emptyTargets();
  const macroCalories = caloriesFromMacros(currentTargets);

  const smartSuggestion = useMemo(() => buildSmartSuggestion(data), [data]);

  const isManualMode = data.macro_setup_mode === "manual";
  const needsBodyData = !data.weight_kg || !data.height_cm || !data.age;
  const needsCustomGoalText =
    data.macro_setup_mode === "guided" &&
    data.nutrition_goal_type === "custom" &&
    !`${data.nutrition_goal_text} ${data.main_goal}`.trim();

  function setSetupMode(mode: MacroSetupMode) {
    if (mode === "manual") {
      onChange({
        macro_setup_mode: "manual",
        macro_maintain: data.macro_maintain ?? emptyTargets(),
        macro_cut: null,
      });
      return;
    }

    onChange({
      macro_setup_mode: "guided",
    });
  }

  function applySuggestion() {
    if (!smartSuggestion) return;

    onChange({
      macro_setup_mode: "guided",
      macro_maintain: smartSuggestion.target,
      macro_cut: null,
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Set your nutrition targets</h2>
        <p className="text-sm text-muted-foreground">
          Add your own calorie and macro targets, or answer a few questions to get
          a smarter suggestion you can edit before saving. You can also skip this
          for now and set it later from Nutrition.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Activity level</label>
        <div className="space-y-2">
          {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ activity_level: value })}
                className={cn(
                  "w-full rounded-xl border bg-card px-4 py-3 text-left text-sm transition-all",
                  data.activity_level === value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{label}</span>
                  {data.activity_level === value ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </div>
              </button>
            ),
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SetupModeButton
          active={isManualMode}
          title="Manual targets"
          body="You already know your calories and macros. Enter them directly."
          icon={<PencilLine className="h-4 w-4 text-primary" />}
          onClick={() => setSetupMode("manual")}
        />

        <SetupModeButton
          active={!isManualMode}
          title="Smart suggestion"
          body="Answer a few nutrition questions and get a goal-based starting point."
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          onClick={() => setSetupMode("guided")}
        />
      </div>

      {isManualMode ? (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Manual nutrition targets</p>
            <p className="text-xs text-muted-foreground">
              Enter the daily targets you want to start with. You can adjust them
              later from Nutrition.
            </p>
          </div>

          <MacroEditor
            targets={currentTargets}
            onChange={(targets) =>
              onChange({
                macro_maintain: targets,
                macro_cut: null,
              })
            }
          />

          <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Calories from macros:{" "}
            <span className="font-medium text-foreground">{macroCalories} kcal</span>
            {currentTargets.cal > 0 && Math.abs(macroCalories - currentTargets.cal) > 120
              ? " — your macro calories do not exactly match your calorie target yet."
              : ""}
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Smart suggestion questions</p>
            <p className="text-xs text-muted-foreground">
              We use your body data, training style, and goal to build a more
              relevant starting point.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">What is your main nutrition goal?</label>
            <div className="grid gap-2">
              {GOAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ nutrition_goal_type: option.value })}
                  className={cn(
                    "rounded-xl border bg-background px-4 py-3 text-left transition-all",
                    data.nutrition_goal_type === option.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{option.label}</span>
                    {data.nutrition_goal_type === option.value ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{option.helper}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Training focus</label>
              <div className="grid gap-2">
                {TRAINING_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange({ training_focus: option.value })}
                    className={cn(
                      "rounded-xl border bg-background px-3 py-2.5 text-left text-sm transition-all",
                      data.training_focus === option.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{option.label}</span>
                      {data.training_focus === option.value ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">How fast do you want to move?</label>
              <div className="grid gap-2">
                {PACE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange({ goal_pace: option.value })}
                    className={cn(
                      "rounded-xl border bg-background px-3 py-2.5 text-left transition-all",
                      data.goal_pace === option.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-3 text-sm">
                      <span>{option.label}</span>
                      {data.goal_pace === option.value ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : null}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {option.helper}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(data.nutrition_goal_type === "custom" ||
            data.nutrition_goal_type === "performance") && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Anything else the suggestion should know?
              </label>
              <Textarea
                value={data.nutrition_goal_text}
                onChange={(e) => onChange({ nutrition_goal_text: e.target.value })}
                rows={4}
                placeholder={
                  data.nutrition_goal_type === "performance"
                    ? "Example: I want to fuel half-marathon training without feeling flat in the gym."
                    : "Example: I want to get leaner while keeping strength and not dropping energy at work."
                }
              />
              <p className="text-xs text-muted-foreground">
                We also use the main goal you entered earlier if it is relevant.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Do you know your current maintenance calories? (optional)
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={data.known_maintenance_calories}
              onChange={(e) => {
                const result = validateClampedNumberInput(e.target.value, {
                  min: 0,
                  max: 10000,
                });
                setMaintenanceError(null);
                if (result.nextValue !== null) {
                  onChange({ known_maintenance_calories: result.nextValue });
                }
              }}
              onBlur={() => {
                const value = Number(data.known_maintenance_calories);
                if (
                  data.known_maintenance_calories.trim() &&
                  Number.isFinite(value) &&
                  value > 0 &&
                  value < 1000
                ) {
                  setMaintenanceError(
                    "If you enter maintenance calories, use at least 1000 kcal.",
                  );
                  return;
                }

                setMaintenanceError(null);
              }}
              aria-invalid={!!maintenanceError}
              placeholder="Example: 2600"
            />
            {maintenanceError ? (
              <p className="text-xs text-destructive">{maintenanceError}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Leave this empty and we will estimate from your body data and activity.
            </p>
          </div>

          {needsBodyData ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
              Add age, weight, and height in the profile step to unlock a smarter
              nutrition suggestion.
            </div>
          ) : needsCustomGoalText ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
              Add a short description of your custom goal so the suggestion can be
              more specific.
            </div>
          ) : smartSuggestion ? (
            <div className="space-y-3 rounded-xl border bg-background p-4">
              <TargetPreview
                title="Suggested starting target"
                description={smartSuggestion.rationale}
                targets={smartSuggestion.target}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={applySuggestion}>
                  Use this suggestion
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onChange({
                      macro_maintain: smartSuggestion.target,
                      macro_cut: null,
                    })
                  }
                >
                  Load it into the editor
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {data.macro_maintain ? (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Your current nutrition target</p>
            <p className="text-xs text-muted-foreground">
              This is the target that will be saved during onboarding. You can still
              fine-tune it here.
            </p>
          </div>

          <TargetPreview
            title="Active target"
            description="This is what your onboarding will save."
            targets={data.macro_maintain}
          />

          <MacroEditor
            targets={data.macro_maintain}
            onChange={(targets) =>
              onChange({
                macro_maintain: targets,
                macro_cut: null,
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
});
