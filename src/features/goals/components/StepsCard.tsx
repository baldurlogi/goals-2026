import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { GoalStep } from "@/features/goals/goalTypes";
import { parseStepDetails, prettyStepLink } from "@/features/goals/stepDetails";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";

// -- sort helpers -------------------------------------
function parseDate(s?: string): number {
    if (!s || s.toLocaleLowerCase() === "ongoing") return Number.MAX_SAFE_INTEGER;
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function stepUrgencyRank(step: GoalStep, todayKey: string): number {
    const due = step.idealFinish?.trim();
    if (!due) return 3;
    if (due < todayKey) return 0;
    if (due === todayKey) return 1;
    return 2;
}

function sortedSteps(steps: GoalStep[], doneMap?: Record<string, boolean>): GoalStep[] {
    const todayKey = getLocalDateKey();
    return [...steps].sort((a,b) => {
        // 1. incomplete steps first, completed steps last
        const aDone = doneMap?.[a.id] ? 1 : 0;
        const bDone = doneMap?.[b.id] ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        // 2. overdue first, then due today, then future dated, then undated
        const urgencyDiff = stepUrgencyRank(a, todayKey) - stepUrgencyRank(b, todayKey);
        if (urgencyDiff !== 0) return urgencyDiff;
        // 3. idealFinish ascending (undated last)
        const dateDiff = parseDate(a.idealFinish) - parseDate(b.idealFinish);
        if (dateDiff !== 0) return dateDiff;
        // 4. manual sort order when available
        const aSort = typeof a.sortOrder === "number" ? a.sortOrder : Number.MAX_SAFE_INTEGER;
        const bSort = typeof b.sortOrder === "number" ? b.sortOrder : Number.MAX_SAFE_INTEGER;
        if (aSort !== bSort) return aSort - bSort;
        // 5. stable tiebreaker: label then id
        return a.label.localeCompare(b.label) || a.id.localeCompare(b.id);
    })
}

export function StepsCard(props: {
    goalId: string;
    goalTitle?: string;
    steps: GoalStep[];
    doneMap?: Record<string, boolean>;
    onToggle: (stepId: string) => void;
    onEditStep?: (stepId: string, stepNumber: number) => void;
    disabled?: boolean;
    maxHeightClassName?: string; // e.g. "md:max-h-[640px]"
    className?: string;
}) {
    const {
        steps: rawSteps,
        doneMap,
        onToggle,
        onEditStep,
        maxHeightClassName = "max-h-none lg:max-h-[640px]",
        className,
        disabled = false,
    } = props;
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

            {/* Keep mobile interactions single-scroll; constrain list on larger screens. */}
            <div className={cn("pr-1 overflow-visible lg:overflow-auto", maxHeightClassName)}>
                <div className="space-y-3">
                    {steps.map((step, index) => {
                        const checked = !!doneMap?.[step.id];
                        const isNext = index === nextIndex && !checked;
                        const isOpen = openId === step.id;
                        const details = parseStepDetails(step);
                        const hasDetails =
                            details.guidance.length > 0 ||
                            Boolean(details.doneWhen) ||
                            details.links.length > 0;

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
                                            disabled={disabled}
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
                                            
                                            <div className="flex shrink-0 items-center gap-1">
                                                {onEditStep ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={disabled}
                                                        onClick={() => onEditStep(step.id, index + 1)}
                                                        className="gap-1.5"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </Button>
                                                ) : null}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={!hasDetails}
                                                    onClick={() => setOpenId(isOpen ? null : step.id)}
                                                >
                                                    {hasDetails ? (isOpen ? "Hide" : "Details") : "No details"}
                                                </Button>
                                            </div>
                                        </div>

                                        {isOpen ? (
                                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                {details.guidance.length ? (
                                                    <div className="rounded-xl border bg-muted/20 p-3 md:col-span-2">
                                                        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                                            How
                                                        </div>
                                                        <div className="mt-2 space-y-2">
                                                            {details.guidance.map((line, lineIndex) => (
                                                                <p
                                                                    key={`${step.id}:guidance:${lineIndex}`}
                                                                    className="text-sm leading-relaxed text-muted-foreground"
                                                                >
                                                                    {line}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {details.doneWhen ? (
                                                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                                                        <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                                            Done when
                                                        </div>
                                                        <p className="mt-2 text-sm leading-relaxed text-foreground">
                                                            {details.doneWhen}
                                                        </p>
                                                    </div>
                                                ) : null}

                                                {details.links.length ? (
                                                    <div className="rounded-xl border bg-background p-3">
                                                        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                                            Links
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {details.links.map((href) => (
                                                                <a
                                                                    key={href}
                                                                    href={href}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                                                                >
                                                                    {prettyStepLink(href)}
                                                                </a>
                                                            ))}
                                                        </div>
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
