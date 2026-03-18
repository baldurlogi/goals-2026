import { memo } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_LABELS,
  calculateMacros,
  type ActivityLevel,
  type MacroTargets,
} from "@/features/onboarding/profileStorage";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

function MacroCard({ label, targets, color }: { label: string; targets: MacroTargets; color: string }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className={cn("text-xs font-semibold uppercase", color)}>{label}</div>
      <div className="text-2xl font-bold">{targets.cal} kcal</div>
      <div className="text-xs text-muted-foreground">
        P {targets.protein}g • C {targets.carbs}g • F {targets.fat}g
      </div>
    </div>
  );
}

function MacroEditor({ targets, onChange }: { targets: MacroTargets; onChange: (t: MacroTargets) => void }) {
  const fields: { key: keyof MacroTargets; label: string }[] = [
    { key: "cal", label: "Calories" },
    { key: "protein", label: "Protein" },
    { key: "carbs", label: "Carbs" },
    { key: "fat", label: "Fat" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.map((f) => (
        <Input
          key={f.key}
          type="number"
          value={targets[f.key]}
          onChange={(e) => onChange({ ...targets, [f.key]: Number(e.target.value) || 0 })}
          aria-label={f.label}
          placeholder={f.label}
        />
      ))}
    </div>
  );
}

export const StepMacros = memo(function StepMacros({ data, onChange }: Props) {
  const hasBodyData = data.weight_kg && data.height_cm && data.age;
  const calculated = hasBodyData
    ? calculateMacros(Number(data.weight_kg), Number(data.height_cm), Number(data.age), data.sex, data.activity_level)
    : null;

  const maintain = data.macro_maintain ?? calculated?.maintain ?? null;
  const cut = data.macro_cut ?? calculated?.cut ?? null;

  const manualMode = Boolean(data.macro_maintain && data.macro_cut);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Set your nutrition targets</h2>
        <p className="text-sm text-muted-foreground">Type your own macros directly or generate suggestions once your body metrics are filled in.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Activity level</label>
        <div className="space-y-2">
          {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ activity_level: value })}
              className={cn(
                "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                data.activity_level === value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-center justify-between">
                {label}
                {data.activity_level === value ? <Check className="h-4 w-4 text-primary" /> : null}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
        <button
          type="button"
          onClick={() => onChange({ macro_maintain: null, macro_cut: null })}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium",
            !manualMode ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          Generate suggestions
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              macro_maintain: maintain ?? { cal: 2200, protein: 130, carbs: 250, fat: 70 },
              macro_cut: cut ?? { cal: 1800, protein: 150, carbs: 170, fat: 55 },
            })
          }
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium",
            manualMode ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          Enter manually
        </button>
      </div>

      {!maintain || !cut ? (
        <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          Add age, weight, and height to generate suggestions, or switch to manual entry right now.
        </div>
      ) : (
        <>
          <MacroCard label="Maintain" targets={maintain} color="text-primary" />
          <MacroCard label="Cut" targets={cut} color="text-amber-500" />
        </>
      )}

      {manualMode && maintain && cut ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Manual targets</p>
            <p className="text-xs text-muted-foreground">You can edit these anytime later from Nutrition.</p>
          </div>
          <MacroEditor targets={maintain} onChange={(t) => onChange({ macro_maintain: t })} />
          <MacroEditor targets={cut} onChange={(t) => onChange({ macro_cut: t })} />
        </div>
      ) : null}
    </div>
  );
});
