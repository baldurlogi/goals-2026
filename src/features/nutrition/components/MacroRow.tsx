import { getMacroStatus, type MacroKey, type MacroStatus } from "../nutritionStatus";

type MacroMode = "min" | "max" | "range";

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(Math.max(v, lo), hi);
}

function statusColor(status: MacroStatus): string {
  if (status === "success") return "text-emerald-200";
  if (status === "warning") return "text-amber-200";
  if (status === "danger") return "text-destructive";
  return "text-muted-foreground";
}

function barColor(status: MacroStatus): string {
  if (status === "success") return "bg-gradient-to-r from-emerald-300 to-cyan-200";
  if (status === "warning") return "bg-gradient-to-r from-amber-300 to-emerald-200";
  if (status === "danger") return "bg-destructive";
  return "bg-muted-foreground/30";
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
    <div className="space-y-2 rounded-[1.15rem] bg-background/14 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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

      <div className="flex items-center gap-2">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-background/60 shadow-inner">
          <div
            className={`absolute inset-y-0 left-0 rounded-full shadow-[0_0_18px_rgba(52,211,153,0.16)] transition-all duration-700 ease-out ${bar}`}
            style={{ width: `${fillPct}%` }}
          />
          <div className="absolute inset-0 animate-[ai-sheen_6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-25" />
        </div>

        <div className={`w-12 text-right text-[11px] font-semibold tabular-nums ${color}`}>
          {pctLabel}
        </div>
      </div>

      <div className="text-right text-[10px] text-muted-foreground tabular-nums">
        {hint}
      </div>
    </div>
  );
}
