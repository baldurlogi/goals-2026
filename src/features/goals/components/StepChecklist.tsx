import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
    steps: { id: string; label: string}[];
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

                        <Label
                        htmlFor={step.id}
                        className={`text-sm leading-snug cursor-pointer ${
                            checked ? "line-through opacity-70" : ""
                        }`}
                        >
                            {step.label}
                        </Label>
                    </div>
                );
            })}
        </div>
    );
}