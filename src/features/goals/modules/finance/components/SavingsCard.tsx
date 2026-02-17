import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

function formatInt(n: number) {
    return new Intl.NumberFormat("da-DK").format(Math.round(n));
}

function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max);
}

export function SavingsCard(props: {
    goalId: string;
    target: number;
    currency?: string;
    className?: string;
}) {
    const { goalId, target, currency = "DKK", className } = props;
    const storageKey = `daily-life:goals:metric:${goalId}:saved`;

    const [saved, setSaved] = useState<number>(0);
    const [add, setAdd] = useState<string>("");

    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return;
            const n = Number(raw);
            if (Number.isFinite(n)) setSaved(n);
        } catch {
            // ignore
        }
    }, [storageKey]);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, String(saved));
        } catch {
            // ignore
        }
    }, [storageKey, saved]);

    const pct = useMemo(() => {
        if (target <= 0) return 0;
        return clamp((saved / target) * 100, 0, 100)
    }, [saved, target]);

    const remaining = Math.max(target - saved, 0);

    function addAmount(delta: number) {
        if (!Number.isFinite(delta)) return;
        setSaved((s) => Math.max(0, s + delta));
    }

    function submitAdd() {
        const n = Number(add.replace(",", "."));
        if (!Number.isFinite(n) || n === 0) return;
        addAmount(n);
        setAdd("")
    }

    return (
        <div className={cn("rounded-2xl border bg-card p-5 shadow-sm space-y-4", className)}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-sm text-muted-foreground">Savings</div>
                    <div className="text-lg font-semibold">75.000 {currency} goal</div>
                    <div className="text-sm text-muted-foreground">
                        Remaining:{" "}
                        <span className="text-foreground font-medium">
                            {formatInt(remaining)} {currency}
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm font-semibold">{Math.round(pct)}%</div>
                    <div className="text-xs text-muted-foreground">
                        {formatInt(saved)}/{formatInt(target)} {currency}
                    </div>
                </div>
            </div>

            <Progress value={pct} className="h-2" />

            <div className="grid gap-2">
                <div className="text-sm font-medium">Saved so far</div>
        
                <div className="flex gap-2">
                    <Input
                        inputMode="numeric"
                        placeholder={`Add amount (${currency})`}
                        value={add}
                        onChange={(e) => setAdd(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") submitAdd();
                        }}
                    />
                    <Button onClick={submitAdd}>Add</Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => addAmount(500)}>
                        +500
                    </Button>
                    <Button variant="secondary" onClick={() => addAmount(1000)}>
                        +1000
                    </Button>
                    <Button variant="secondary" onClick={() => addAmount(2500)}>
                        +2500
                    </Button>
                    <Button variant="secondary" onClick={() => addAmount(7500)}>
                        +7500
                    </Button>
                </div>

                <div className="pt-2 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Tip: hit +7.500 each month for the plan.
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSaved(0);
                            setAdd("");
                        }}
                    >
                        Reset savings
                    </Button>
                </div>
            </div>
        </div>
    );
}