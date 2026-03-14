type MacroMode = "min" | "max" | "range";

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(Math.max(v, lo), hi);
}

function statusColor(value: number, target: number, mode: MacroMode): string {
  if (target <= 0) return "text-muted-foreground";
  const pct = value / target;

  if (mode === "min") {
    return pct >= 1
      ? "text-emerald-500"
      : pct >= 0.85
      ? "text-amber-500"
      : "text-destructive";
  }

  if (mode === "max") {
    return pct <= 1 ? "text-emerald-500" : "text-destructive";
  }

  return Math.abs(pct - 1) <= 0.15
    ? "text-emerald-500"
    : pct > 1.15
    ? "text-destructive"
    : "text-amber-500";
}

function barColor(value: number, target: number, mode: MacroMode): string {
  if (target <= 0) return "bg-muted";
  const pct = value / target;

  if (mode === "min") {
    return pct >= 1
      ? "bg-emerald-500"
      : pct >= 0.85
      ? "bg-amber-500"
      : "bg-destructive";
  }

  if (mode === "max") {
    return pct <= 1 ? "bg-primary" : "bg-destructive";
  }

  return Math.abs(pct - 1) <= 0.15
    ? "bg-emerald-500"
    : pct > 1.15
    ? "bg-destructive"
    : "bg-amber-500";
}

export function MacroRow(props: {
  label: string;
  value: number;
  target: number;
  unit: string;
  mode?: MacroMode;
  rangePct?: number;
}) {
  const { label, value, target, unit, mode = "range" } = props;

  const rawPct = target > 0 ? (value / target) * 100 : 0;
  const fillPct = clamp(rawPct);
  const pctLabel = `${Math.max(0, Math.round(rawPct))}%`;
  const remaining = target - value;

  const color = statusColor(value, target, mode);
  const bar = barColor(value, target, mode);

  const hint =
    value === 0
      ? `${Math.floor(target)} ${unit} to go`
      : remaining > 0
      ? `${Math.floor(remaining)} ${unit} remaining`
      : remaining === 0
      ? "✓ Target hit"
      : `${Math.floor(Math.abs(remaining))} ${unit} over`;

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>

        <div className="flex items-baseline gap-1 tabular-nums">
          <span className={`text-sm font-semibold ${color}`}>
            {Math.floor(value)}
          </span>
          <span className="text-xs text-muted-foreground">
            / {Math.floor(target)} {unit}
          </span>
        </div>
      </div>

      {/* Progress row with percentage on the right */}
      <div className="flex items-center gap-2">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${bar}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>

        <div className={`w-12 text-right text-[11px] font-semibold tabular-nums ${color}`}>
          {pctLabel}
        </div>
      </div>

      {/* Remaining / over hint */}
      <div className="text-right text-[10px] text-muted-foreground tabular-nums">
        {hint}
      </div>
    </div>
  );
}