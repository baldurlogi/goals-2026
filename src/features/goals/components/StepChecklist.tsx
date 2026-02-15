import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type Step = {
  id: string;
  label: string;
  notes?: string;
  idealFinish?: string;
  estimatedTime?: string;
  links?: string[];
};

type Props = {
  steps: Step[];
  doneMap?: Record<string, boolean>;
  onToggle: (stepId: string) => void;
};

export function StepChecklist({ steps, doneMap, onToggle }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {steps.map((step) => {
        const checked = !!doneMap?.[step.id];

        return (
          <div
            key={step.id}
            className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2 hover:bg-muted/30 transition-colors"
          >
            <Checkbox
              id={step.id}
              checked={checked}
              onCheckedChange={() => onToggle(step.id)}
              className="mt-0.5"
            />

            <div className="min-w-0 space-y-1">
              <Label
                htmlFor={step.id}
                className={`text-sm leading-snug cursor-pointer ${
                  checked ? "line-through opacity-70" : ""
                }`}
              >
                {step.label}
              </Label>

              {(step.idealFinish || step.estimatedTime) && (
                <div className="text-xs text-muted-foreground">
                  {step.idealFinish ? `🎯 ${step.idealFinish}` : null}
                  {step.idealFinish && step.estimatedTime ? " • " : null}
                  {step.estimatedTime ? `⏱️ ${step.estimatedTime}` : null}
                </div>
              )}

              {step.notes && (
                <p className="text-xs text-muted-foreground leading-snug">
                  {step.notes}
                </p>
              )}

              {step.links?.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {step.links.map((href) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline text-muted-foreground hover:text-foreground"
                    >
                      {href.replace(/^https?:\/\//, "")}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
