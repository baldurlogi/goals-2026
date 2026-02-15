import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type MacroMode = "min" | "max" | "range";

function getStatus(
    value: number,
    target: number,
    mode: MacroMode,
    rangePct: number,
) {
    const delta = value - target;
    const absPctOff = target <= 0 ? 0 : Math.abs(delta) / target;

    if (mode === "min") {
        if (value >= target) return { status: "good" as const, deltaLabel: `+${delta}` };
        // close but under
        if (absPctOff <= rangePct) return { status: "warn" as const, deltaLabel: `${delta}` };
        return { status: "bad" as const, deltaLabel: `${delta}` };
    }

    if (mode === "max") {
        if (value <= target) return { status: "good" as const, deltaLabel: `${delta}` };
        // over is bad
        return { status: "bad" as const, deltaLabel: `${delta}` };
    }

    if (absPctOff <= rangePct) {
        return { status: "warn" as const, deltaLabel: delta > 0 ? `+${delta}` : `${delta}` };
    }
    // outside range -> warn (or "bad" if you want harsher)
    return { status: "warn" as const, deltaLabel: delta > 0 ? `+${delta}` : `${delta}` };
}

export function MacroRow(props: {
    label: string;
    value: number;
    target: number;
    unit: string;
    mode?: MacroMode;
    rangePct?: number;
}) {
    const { label, value, target, unit, mode = "range", rangePct = 0.1 } = props;

    const pct = target <= 0 ? 0 : Math.min(Math.max((value / target) * 100, 0), 100);
    const diff = value - target;

    const { status } = getStatus(value, target, mode, rangePct);

    const deltaClass =
        status === "good"
        ? "text-emerald-500"
        : status === "warn"
            ? "text-amber-500"
            : "text-destructive";

    // show delta only if meaningful (keeps UI clean)
    const showDelta = Math.abs(diff) > (unit === "kcal" ? 25 : 5);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-5 px-2 text-[11px]">
                        {value}
                        {unit}
                    </Badge>

                    <span className="text-[11px] text-muted-foreground">
                        / {target}
                        {unit}
                    </span>

                    {showDelta && (
                        <span className={`text-[11px] font-medium ${deltaClass}`}>
                            {diff > 0 ? "+" : ""}
                            {diff}
                            {unit}
                        </span>
                    )}
                </div>
            </div>

            <Progress value={pct} className="h-2" />
        </div>
    )
}