import { memo } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { MacroTargets } from "@/features/onboarding/profileStorage";

type Props = {
  macroMaintain: MacroTargets | null;
  macroCut: MacroTargets | null;
  calculated: { maintain: MacroTargets; cut: MacroTargets } | null;
  onMacroMaintainChange: (targets: MacroTargets) => void;
  onMacroCutChange: (targets: MacroTargets) => void;
  onRecalculate: () => void;
};

function MacroEditor({
  targets,
  onChange,
}: {
  targets: MacroTargets;
  onChange: (t: MacroTargets) => void;
}) {
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
            type="number"
            min="0"
            value={targets[f.key]}
            onChange={(e) => onChange({ ...targets, [f.key]: Number(e.target.value) || 0 })}
            className="h-9 text-sm"
          />
        </div>
      ))}
    </div>
  );
}

export const MacrosSection = memo(function MacrosSection({
  macroMaintain,
  macroCut,
  calculated,
  onMacroMaintainChange,
  onMacroCutChange,
  onRecalculate,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">🥗 Macros</div>
        <Button type="button" variant="outline" size="sm" className="gap-2" disabled={!calculated} onClick={onRecalculate}>
          <RefreshCw className="h-4 w-4" />
          Recalculate
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold">Maintenance targets</div>
        <MacroEditor
          targets={
            macroMaintain ??
            calculated?.maintain ?? {
              cal: 2400,
              protein: 156,
              carbs: 260,
              fat: 68,
            }
          }
          onChange={onMacroMaintainChange}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="text-sm font-semibold">Cut phase targets</div>
        <MacroEditor
          targets={
            macroCut ??
            calculated?.cut ?? {
              cal: 2000,
              protein: 170,
              carbs: 185,
              fat: 58,
            }
          }
          onChange={onMacroCutChange}
        />
      </div>

      {!calculated ? (
        <div className="text-xs text-muted-foreground">Fill in age/height/weight to enable recalculation.</div>
      ) : null}
    </>
  );
});
