import { memo, useCallback, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_MODULES, type ModuleId } from "@/features/modules/modules";
import type { OnboardingData } from "./types";

type Props = { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void };

const FEATURED_MODULE_IDS: ModuleId[] = [
  "goals",
  "fitness",
  "nutrition",
  "schedule",
];

export const StepModules = memo(function StepModules({ data, onChange }: Props) {
  const [showAll, setShowAll] = useState(false);

  const toggle = useCallback(
    (id: ModuleId) => {
      if (id === "goals") return;

      const next = data.enabled_modules.includes(id)
        ? data.enabled_modules.filter((m) => m !== id)
        : [...data.enabled_modules, id];
      if (next.length === 0) return;
      onChange({ enabled_modules: next });
    },
    [data.enabled_modules, onChange],
  );

  const featuredModules = useMemo(
    () =>
      FEATURED_MODULE_IDS.map((id) => ALL_MODULES.find((mod) => mod.id === id)).filter(
        (mod): mod is (typeof ALL_MODULES)[number] => Boolean(mod),
      ),
    [],
  );

  const extraModules = useMemo(
    () => ALL_MODULES.filter((mod) => !FEATURED_MODULE_IDS.includes(mod.id)),
    [],
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">What do you want to track?</h2>
        <p className="text-sm text-muted-foreground">
          Start with 4 recommended modules so setup stays simple. You can add
          more now or later from Profile settings.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Recommended to start
          </div>
          <div className="text-xs text-muted-foreground">4 modules</div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {featuredModules.map((mod) => {
            const enabled = data.enabled_modules.includes(mod.id);
            const Icon = mod.icon;
            const isRequired = mod.id === "goals";

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
                  isRequired && "cursor-default",
                )}
                disabled={isRequired}
              >
                {enabled ? (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />
                ) : null}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "rounded-lg border p-2",
                        enabled
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "bg-muted/30 text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{mod.label}</div>
                        {isRequired ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Required
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Starter
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{mod.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isRequired ? "Begyn starts here." : `Section: ${mod.section}`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showAll ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              More modules
            </div>
            <div className="text-xs text-muted-foreground">
              Add these if they fit your life right now
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {extraModules.map((mod) => {
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
                  {enabled ? (
                    <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />
                  ) : null}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "rounded-lg border p-2",
                          enabled
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "bg-muted/30 text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="text-sm font-semibold">{mod.label}</div>
                        <p className="text-xs text-muted-foreground">{mod.description}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Section: {mod.section}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {extraModules.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {showAll ? "Show fewer modules" : `Show ${extraModules.length} more modules`}
        </button>
      ) : null}
    </div>
  );
});
