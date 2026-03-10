import { useState } from "react";
import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, TrendingUp, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  currentBest,
  progressPct,
  fmtValue,
  CATEGORY_LABELS,
  type PRGoal,
  type PREntry,
} from "@/features/fitness/fitnessStorage";

// ── Sparkline tooltip ─────────────────────────────────────────────────────────

function SparkTooltip({
  active, payload, unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string } }>;
  unit: PRGoal["unit"];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 shadow-md text-xs">
      <div className="font-semibold">{fmtValue(p.value, unit)}</div>
      <div className="text-muted-foreground">{p.payload.date}</div>
    </div>
  );
}

// ── Log form ──────────────────────────────────────────────────────────────────

function LogForm({
  unit, onSubmit, onCancel,
}: {
  unit: PRGoal["unit"];
  onSubmit: (value: number, notes: string) => void;
  onCancel: () => void;
}) {
  const [val,   setVal]   = useState("");
  const [notes, setNotes] = useState("");
  const placeholder = unit === "seconds"
    ? "Seconds (e.g. 75 for 1:15)"
    : `Value in ${unit}`;

  return (
    <div className="mt-2 space-y-2 rounded-xl border bg-muted/20 p-3">
      <div className="flex gap-2">
        <input
          type="number" min={0} placeholder={placeholder} value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-28 rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <input
          type="text" placeholder="Notes (optional)" value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={!val || Number(val) <= 0}
          onClick={() => onSubmit(Number(val), notes)}>
          Save PR
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Goal editor ───────────────────────────────────────────────────────────────

function GoalEditor({
  current, unit, onSave, onCancel,
}: {
  current: number; unit: string;
  onSave: (val: number) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState(String(current));
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number" value={val} min={0}
        onChange={(e) => setVal(e.target.value)}
        className="w-20 rounded border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <span className="text-xs text-muted-foreground">{unit}</span>
      <button type="button"
        onClick={() => Number(val) > 0 && onSave(Number(val))}
        className="text-[10px] font-semibold text-emerald-500 hover:text-emerald-400">
        Save
      </button>
      <button type="button" onClick={onCancel}
        className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>
    </span>
  );
}

// ── History row ───────────────────────────────────────────────────────────────

function HistoryRow({
  entry, index, unit, onDelete,
}: {
  entry: PREntry; index: number; unit: PRGoal["unit"];
  onDelete: (i: number) => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/30">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{entry.date}</span>
      <span className="flex-1 text-sm font-semibold tabular-nums">
        {fmtValue(entry.value, unit)}
      </span>
      {entry.notes && (
        <span className="text-xs text-muted-foreground italic truncate max-w-[120px]">{entry.notes}</span>
      )}
      <button type="button" onClick={() => onDelete(index)}
        className="invisible ml-auto shrink-0 text-muted-foreground/40 hover:text-destructive group-hover:visible">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Main PRCard ───────────────────────────────────────────────────────────────

interface PRCardProps {
  goal: PRGoal;
  onLog:        (id: string, value: number, notes?: string) => void;
  onGoalUpdate: (id: string, goal: number) => void;
  onDelete:     (id: string, index: number) => void;
  onRemove:     (id: string) => void;
}

export function PRCard({ goal, onLog, onGoalUpdate, onDelete, onRemove }: PRCardProps) {
  const [showLog,     setShowLog]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showChart,   setShowChart]   = useState(false);
  const [editGoal,    setEditGoal]    = useState(false);
  const [showMenu,    setShowMenu]    = useState(false);

  const best = currentBest(goal.history);
  const pct  = progressPct(best, goal.goal);

  const chartData = [...goal.history]
    .slice(0, 20)
    .reverse()
    .map((e) => ({ date: e.date, value: e.value }));

  const trend =
    goal.history.length >= 2
      ? goal.history[0].value - goal.history[1].value
      : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm truncate">{goal.label}</CardTitle>
              <span className="shrink-0 text-[10px] text-muted-foreground/60">
                {CATEGORY_LABELS[goal.category].split(" ")[0]}
              </span>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Goal:{" "}
              {editGoal ? (
                <GoalEditor
                  current={goal.goal}
                  unit={goal.unit}
                  onSave={(v) => { onGoalUpdate(goal.id, v); setEditGoal(false); }}
                  onCancel={() => setEditGoal(false)}
                />
              ) : (
                <span>
                  {goal.goalLabel}{" "}
                  <button type="button" onClick={() => setEditGoal(true)}
                    className="inline-flex text-muted-foreground/50 hover:text-muted-foreground">
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
            </CardDescription>
          </div>

          <div className="flex items-start gap-2 shrink-0">
            <div className="text-right">
              {best !== null ? (
                <>
                  <div className="text-xl font-bold tabular-nums leading-none">
                    {fmtValue(best, goal.unit)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                    {trend !== null && trend !== 0 && (
                      <span className={trend > 0 ? "text-emerald-500" : "text-rose-500"}>
                        <TrendingUp className={[
                          "h-2.5 w-2.5 inline",
                          trend < 0 ? "rotate-180" : "",
                        ].join(" ")} />
                        {" "}{trend > 0 ? "+" : ""}{fmtValue(Math.abs(trend), goal.unit)}
                      </span>
                    )}
                    <span>PR</span>
                  </div>
                </>
              ) : (
                <div className="text-xs italic text-muted-foreground mt-1">No PR yet</div>
              )}
            </div>

            {/* Overflow menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((s) => !s)}
                className="p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-6 z-20 rounded-xl border bg-popover shadow-lg py-1 min-w-[140px]">
                    <button
                      type="button"
                      onClick={() => { setShowMenu(false); onRemove(goal.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove goal
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <Progress value={pct} className="h-1.5" />
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{pct}% to goal</span>
            {best !== null && best >= goal.goal && (
              <span className="text-emerald-500 font-semibold">🎯 Goal reached!</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-2">
        {/* Chart toggle */}
        {chartData.length >= 2 && (
          <button
            type="button"
            onClick={() => setShowChart((s) => !s)}
            className="w-full text-left"
          >
            {showChart ? (
              <div className="mt-1 rounded-xl border bg-muted/20 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Progress chart
                  </span>
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" hide />
                    <YAxis
                      domain={["auto", "auto"]}
                      tickFormatter={(v) => fmtValue(v, goal.unit)}
                      tick={{ fontSize: 9 }}
                      width={42}
                    />
                    <ReferenceLine
                      y={goal.goal}
                      strokeDasharray="4 2"
                      strokeOpacity={0.4}
                    />
                    <Tooltip content={<SparkTooltip unit={goal.unit} />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--foreground))", strokeWidth: 0 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <TrendingUp className="h-3 w-3" />
                <span>Show chart ({chartData.length} entries)</span>
                <ChevronDown className="h-3 w-3 ml-auto" />
              </div>
            )}
          </button>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm" variant={showLog ? "default" : "outline"}
            className="h-7 gap-1 text-xs"
            onClick={() => { setShowLog((s) => !s); setShowHistory(false); }}
          >
            <Plus className="h-3 w-3" /> Log PR
          </Button>

          {goal.history.length > 0 && (
            <Button
              size="sm" variant="ghost"
              className="h-7 gap-1 text-xs text-muted-foreground"
              onClick={() => { setShowHistory((s) => !s); setShowLog(false); }}
            >
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              History ({goal.history.length})
            </Button>
          )}
        </div>

        {showLog && (
          <LogForm
            unit={goal.unit}
            onSubmit={(v, n) => { onLog(goal.id, v, n); setShowLog(false); }}
            onCancel={() => setShowLog(false)}
          />
        )}

        {showHistory && (
          <div className="mt-1 space-y-0.5 max-h-48 overflow-auto rounded-xl border p-2">
            {goal.history.map((entry, i) => (
              <HistoryRow
                key={`${entry.date}-${i}`}
                entry={entry} index={i} unit={goal.unit}
                onDelete={(idx) => onDelete(goal.id, idx)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}