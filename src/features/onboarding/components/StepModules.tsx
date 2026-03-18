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
        <p className="text-sm text-muted-foreground">Goals is required to get started. Everything else is optional, and you can change these modules later in Profile.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ALL_MODULES.map((mod) => {
          const enabled = data.enabled_modules.includes(mod.id);
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => toggle(mod.id)}
              className={cn(
                "relative rounded-xl border bg-card p-4 text-left transition-all",
                enabled
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40",
              )}
            >
              {enabled ? <Check className="absolute right-3 top-3 h-4 w-4 text-primary" /> : null}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={cn("rounded-lg border p-2", enabled ? "border-primary/20 bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="text-sm font-semibold">{mod.label}</div>
                    <p className="text-xs text-muted-foreground">{mod.description}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Section: {mod.section}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
