import { memo, useCallback } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_MODULES, type ModuleId } from "@/features/modules/modules";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

export const StepModules = memo(function StepModules({ data, onChange }: Props) {
  const toggle = useCallback(
    (id: ModuleId) => {
      const next = data.enabled_modules.includes(id)
        ? data.enabled_modules.filter((m) => m !== id)
        : [...data.enabled_modules, id];
      if (next.length === 0) return;
      onChange({ enabled_modules: next });
    },
    [data.enabled_modules, onChange],
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1">
      <h2 className="text-xl font-bold">What do you want to track?</h2>
      <p className="text-sm text-muted-foreground">Goals is preselected. Add anything else you want right now.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ALL_MODULES.map((mod) => {
          const enabled = data.enabled_modules.includes(mod.id);
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => toggle(mod.id)}
              className={cn(
                "relative rounded-xl border p-4 text-left transition-all",
                enabled
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-muted/20 hover:border-primary/40",
              )}
            >
              {enabled ? <Check className="absolute right-3 top-3 h-4 w-4 text-primary" /> : null}
              <Icon className="mb-2 h-5 w-5 text-muted-foreground" />
              <div className="text-sm font-semibold">{mod.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
