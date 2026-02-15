import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function MacroRow(props: {
    label: string;
    value: number;
    target: number;
    unit: string;
}) {
    const { label, value, target, unit } = props;
    const pct = target <= 0 ? 0 : Math.min((value / target ) * 100, 100);
    const diff = value - target;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-5 px-2 text-[11px]">
                        {value}{unit}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                        / {target}{unit}
                    </span>
                    {Math.abs(diff) > 5 && (
                        <span className={`text-[11px] font-medium ${diff > 0 ? "text-emerald-500" : "text-destructive"}`}>
                            {diff > 0 ? "+" : ""}
                            {diff}{unit}
                        </span>
                    )}
                </div>
            </div>

            <Progress value={pct} className="h-2" />
        </div>
    )
}