import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { GoalStep } from "@/features/goals/goalTypes";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

function prettyHref(href: string) {
    return href.replace(/^https?:\/\//, "");
}

// -- sort helpers -------------------------------------
function parseDate(s?: string): number {
    if (!s || s.toLocaleLowerCase() === "ongoing") return Number.MAX_SAFE_INTEGER;
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function sortedSteps(steps: GoalStep[], doneMap?: Record<string, boolean>): GoalStep[] {
    return [...steps].sort((a,b) => {
        // 1. idealFinish ascending (undated last)
        const dateDiff = parseDate(a.idealFinish) - parseDate(b.idealFinish);
        if (dateDiff !== 0) return dateDiff;
        // 2. incomplete before complete
        const aDone = doneMap?.[a.id] ? 1 : 0;
        const bDone = doneMap?.[b.id] ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        // 3. stable tiebraker: label then id
        return a.label.localeCompare(b.label) || a.id.localeCompare(b.id);
    })
}

export function StepsCard(props: {
    goalId: string;
    goalTitle?: string;
    steps: GoalStep[];
    doneMap?: Record<string, boolean>;
    onToggle: (stepId: string) => void;
    heightClassName?: string; // e.g. "h-[640px]"
    className?: string;
}) {
    const { steps: rawSteps, doneMap, onToggle, heightClassName = "h-[640px]", className } = props;
    const steps = sortedSteps(rawSteps, doneMap);

    const nextIndex = useMemo(
        () => steps.findIndex((s) => !doneMap?.[s.id]),
        [steps, doneMap]
    );

    const [openId, setOpenId] = useState<string | null>(null);

    const doneCount = useMemo(
        () => steps.reduce((acc, s) => acc + (doneMap?.[s.id] ? 1 : 0), 0),
        [steps, doneMap]
    );

    return (
        <div className={cn("rounded-2xl border bg-card p-5 shadow-sm space-y-4", className)}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-sm text-muted-foreground">Steps</div>
                    <div className="text-lg font-semibold">What to do next</div>
                    <div className="text-sm text-muted-foreground">
                        Start at <span className="text-foreground font-medium">#</span>
                        <span className="text-foreground font-medium">
                            {nextIndex >= 0 ? nextIndex + 1 : "Done"}
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm font-semibold">
                        {doneCount}/{steps.length}
                    </div>
                    <div className="text-xs text-muted-foreground">completed</div>
                </div>
            </div>

            {/* Scroll are inside card */}
            <div className={cn("overflow-auto pr-2", heightClassName)}>
                <div className="space-y-3">
                    {steps.map((step, index) => {
                        const checked = !!doneMap?.[step.id];
                        const isNext = index === nextIndex && !checked;
                        const isOpen = openId === step.id;

                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    "rounded-2xl border p-4 transition-colors",
                                    isNext ? "border-foreground/25 bg-muted/20" : "border-border/60",
                                    checked ? "opacity-80" : ""  
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex items-center gap-3">
                                        <Checkbox
                                            id={step.id}
                                            checked={checked}
                                            onCheckedChange={() => onToggle(step.id)}
                                        />

                                        <div
                                            className={cn(
                                                "h-7 w-7 shrink-0 rounded-full border flex items-center justify-center text-sm font-semibold",
                                                isNext ? "border-foreground/30" : "border-border/60",
                                                checked ? "bg-muted text-muted-foreground" : "bg-background"
                                            )}
                                            title={`Step ${index + 1}`}
                                        >
                                            {index + 1}
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div
                                                    className={cn(
                                                        "text-base font-semibold leading-snug",
                                                        checked ? "line-through text-muted-foreground" : ""
                                                    )}
                                                >
                                                    {step.label}
                                                </div>


                                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                                {step.idealFinish ? (
                                                    <span>📅 {step.idealFinish}</span>
                                                ) : null}
                                                {step.estimatedTime ? (
                                                    <span>⏱ {step.estimatedTime}</span>
                                                ) : null}
                                                {isNext ? (
                                                    <span className="text-foreground font-medium">
                                                    • Next up
                                                    </span>
                                                ) : null}
                                                </div>
                                            </div>
                                            
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setOpenId(isOpen ? null : step.id)}
                                            >
                                                {isOpen ? "Hide" : "Details"}
                                            </Button>
                                        </div>

                                        {isOpen ? (
                                            <div className="mt-3 space-y-2">
                                                {step.notes ? (
                                                    <div className="text-sm text-muted-foreground leading-relaxed">
                                                        {step.notes}
                                                    </div>
                                                ) : null}

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
                                                                {prettyHref(href)}
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}