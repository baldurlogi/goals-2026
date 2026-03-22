import { getMacroStatus, type MacroKey, type MacroStatus } from "../nutritionStatus";

type MacroMode = "min" | "max" | "range";

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(Math.max(v, lo), hi);
}

function statusColor(status: MacroStatus): string {
  if (status === "success") return "text-emerald-500";
  if (status === "warning") return "text-amber-500";
  if (status === "danger") return "text-destructive";
  return "text-muted-foreground";
}

function barColor(status: MacroStatus): string {
  if (status === "success") return "bg-emerald-500";
  if (status === "warning") return "bg-amber-500";
  if (status === "danger") return "bg-destructive";
  return "bg-muted";
}

export function MacroRow(props: {
  macroKey: MacroKey;
  label: string;
  value: number;
  target: number;
  unit: string;
  mode?: MacroMode;
  rangePct?: number;
}) {
  const { macroKey, label, value, target, unit, mode: _mode = "range" } = props;

  const rawPct = target > 0 ? (value / target) * 100 : 0;
  const fillPct = clamp(rawPct);
  const pctLabel = `${Math.max(0, Math.round(rawPct))}%`;
  const remaining = target - value;

  const status = getMacroStatus(macroKey, value, target);
  const color = statusColor(status);
  const bar = barColor(status);

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
