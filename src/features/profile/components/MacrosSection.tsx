import { memo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { MacroTargets } from "@/features/onboarding/profileStorage";
import {
  getPhaseTargetsForEditor,
  NUTRITION_PHASE_OPTIONS,
  normalizeNutritionGoalFocuses,
  type NutritionPhase,
} from "@/features/nutrition/nutritionData";
import { validateClampedNumberInput } from "@/lib/numericInput";
import { cn } from "@/lib/utils";

type Props = {
  macroMaintain: MacroTargets | null;
  macroCut: MacroTargets | null;
  macroRecomp: MacroTargets | null;
  macroMuscleGain: MacroTargets | null;
  macroPerformance: MacroTargets | null;
  nutritionGoalFocuses: NutritionPhase[];
  calculated: { maintain: MacroTargets; cut: MacroTargets } | null;
  onMacroMaintainChange: (targets: MacroTargets) => void;
  onMacroCutChange: (targets: MacroTargets) => void;
  onMacroRecompChange: (targets: MacroTargets) => void;
  onMacroMuscleGainChange: (targets: MacroTargets) => void;
  onMacroPerformanceChange: (targets: MacroTargets) => void;
  onNutritionGoalFocusesChange: (focuses: NutritionPhase[]) => void;
  onRecalculate: () => void;
};

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

  const fields: { key: keyof MacroTargets; label: string; unit: string }[] = [
    { key: "cal", label: "Calories", unit: "kcal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carbs", label: "Carbs", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="text-xs text-muted-foreground">
            {f.label} ({f.unit})
          </label>
          <Input
            type="text"
            inputMode="numeric"
            value={targets[f.key] > 0 ? String(targets[f.key]) : ""}
            onChange={(e) => {
              const result = validateClampedNumberInput(e.target.value, {
                min: 0,
                max: f.key === "cal" ? 10000 : 1000,
              });
              setFieldErrors((prev) => ({
                ...prev,
                [f.key]: result.error,
              }));
              if (result.nextValue === null) return;
              onChange({
                ...targets,
                [f.key]: result.nextValue === "" ? 0 : Number(result.nextValue),
              });
            }}
            aria-invalid={!!fieldErrors[f.key]}
            className="h-9 text-sm"
          />
          {fieldErrors[f.key] ? (
            <p className="text-xs text-destructive">{fieldErrors[f.key]}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export const MacrosSection = memo(function MacrosSection({
  macroMaintain,
  macroCut,
  macroRecomp,
  macroMuscleGain,
  macroPerformance,
  nutritionGoalFocuses,
  calculated,
  onMacroMaintainChange,
  onMacroCutChange,
  onMacroRecompChange,
  onMacroMuscleGainChange,
  onMacroPerformanceChange,
  onNutritionGoalFocusesChange,
  onRecalculate,
}: Props) {
  const selectedFocuses = normalizeNutritionGoalFocuses(nutritionGoalFocuses);
  const showMaintainTargets = selectedFocuses.some(
    (focus) =>
      focus === "maintain" ||
      focus === "muscle_gain" ||
      focus === "performance",
  );
  const showFatLossTargets = selectedFocuses.some(
    (focus) => focus === "fat_loss" || focus === "recomp",
  );
  const derivedTargetProfile = {
    display_name: null,
    macro_maintain:
      macroMaintain ??
      calculated?.maintain ?? {
        cal: 2400,
        protein: 156,
        carbs: 260,
        fat: 68,
      },
    macro_cut:
      macroCut ??
      calculated?.cut ?? {
        cal: 2000,
        protein: 170,
        carbs: 185,
        fat: 58,
      },
    macro_recomp: macroRecomp,
    macro_muscle_gain: macroMuscleGain,
    macro_performance: macroPerformance,
  } as const;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">🥗 Macros</div>
        <Button type="button" variant="outline" size="sm" className="gap-2" disabled={!calculated} onClick={onRecalculate}>
          <RefreshCw className="h-4 w-4" />
          Recalculate
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold">Goals shown in Nutrition</div>
          <p className="text-xs text-muted-foreground">
            Keep the Nutrition page focused on the goal types you actually use.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {NUTRITION_PHASE_OPTIONS.map((option) => {
            const selected = selectedFocuses.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (selected && selectedFocuses.length === 1) {
                    return;
                  }

                  const next = selected
                    ? selectedFocuses.filter((value) => value !== option.value)
                    : [...selectedFocuses, option.value];

                  onNutritionGoalFocusesChange(normalizeNutritionGoalFocuses(next));
                }}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  selected
                    ? "border-violet-400/60 bg-violet-500/10"
                    : "border-border bg-background hover:bg-muted/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {option.emoji} {option.label}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {option.helper}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
                      selected
                        ? "bg-violet-500/15 text-violet-200"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {selected ? "Shown" : "Hidden"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showMaintainTargets || showFatLossTargets ? <Separator /> : null}

      {showMaintainTargets ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Base / maintenance targets</div>
            <p className="text-xs text-muted-foreground">
              Used for maintain, muscle gain, and performance views.
            </p>
          </div>
          <MacroEditor
            targets={
              derivedTargetProfile.macro_maintain
            }
            onChange={onMacroMaintainChange}
          />
        </div>
      ) : null}

      {showMaintainTargets && showFatLossTargets ? <Separator /> : null}

      {showFatLossTargets ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Fat loss targets</div>
            <p className="text-xs text-muted-foreground">
              Used for fat loss and recomp views.
            </p>
          </div>
          <MacroEditor
            targets={
              derivedTargetProfile.macro_cut
            }
            onChange={onMacroCutChange}
          />
        </div>
      ) : null}

      {selectedFocuses.includes("recomp") ? <Separator /> : null}

      {selectedFocuses.includes("recomp") ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Recomp targets</div>
            <p className="text-xs text-muted-foreground">
              Separate targets for body recomposition if you want to tune them directly.
            </p>
          </div>
          <MacroEditor
            targets={getPhaseTargetsForEditor("recomp", derivedTargetProfile)}
            onChange={onMacroRecompChange}
          />
        </div>
      ) : null}

      {selectedFocuses.includes("muscle_gain") ? <Separator /> : null}

      {selectedFocuses.includes("muscle_gain") ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Muscle gain targets</div>
            <p className="text-xs text-muted-foreground">
              Separate lean-gain targets if you do not want to rely on the base maintain setup.
            </p>
          </div>
          <MacroEditor
            targets={getPhaseTargetsForEditor("muscle_gain", derivedTargetProfile)}
            onChange={onMacroMuscleGainChange}
          />
        </div>
      ) : null}

      {selectedFocuses.includes("performance") ? <Separator /> : null}

      {selectedFocuses.includes("performance") ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Performance targets</div>
            <p className="text-xs text-muted-foreground">
              Separate training-fuel targets when performance matters more than the base setup.
            </p>
          </div>
          <MacroEditor
            targets={getPhaseTargetsForEditor("performance", derivedTargetProfile)}
            onChange={onMacroPerformanceChange}
          />
        </div>
      ) : null}

      {!calculated ? (
        <div className="text-xs text-muted-foreground">Fill in age/height/weight to enable recalculation.</div>
      ) : null}
    </>
  );
});
