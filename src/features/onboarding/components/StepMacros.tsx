import { memo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { calculateMacros, type MacroTargets } from "@/features/onboarding/profileStorage";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

function MacroCard({ label, targets, color }: { label: string; targets: MacroTargets; color: string }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className={cn("text-xs font-semibold uppercase", color)}>{label}</div>
      <div className="text-2xl font-bold">{targets.cal} kcal</div>
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

  if (!maintain || !cut) return <div className="text-sm text-muted-foreground">Skip or enter body data first.</div>;

  return (
    <div className="space-y-4">
      <MacroCard label="Maintain" targets={maintain} color="text-primary" />
      <MacroCard label="Cut" targets={cut} color="text-amber-500" />
      <MacroEditor targets={maintain} onChange={(t) => onChange({ macro_maintain: t })} />
      <MacroEditor targets={cut} onChange={(t) => onChange({ macro_cut: t })} />
    </div>
  );
});
