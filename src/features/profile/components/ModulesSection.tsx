import { memo, useCallback } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_MODULES, type ModuleId } from "@/features/modules/modules";

type Props = {
  value: ModuleId[];
  onChange: (next: ModuleId[]) => void;
};

export const ModulesSection = memo(function ModulesSection({ value, onChange }: Props) {
  const toggle = useCallback(
    (id: ModuleId) => {
      const next = value.includes(id) ? value.filter((m) => m !== id) : [...value, id];
      if (next.length === 0) return;
      onChange(next);
    },
    [onChange, value],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose what you want to see across your dashboard and navigation. Keep at least one module enabled.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ALL_MODULES.map((mod) => {
          const enabled = value.includes(mod.id);
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
              {enabled && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-sm font-semibold">{mod.label}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{mod.description}</div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length} of {ALL_MODULES.length} modules enabled
      </p>
    </div>
  );
});
