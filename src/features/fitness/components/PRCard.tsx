import { useState } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_LABELS } from "../constants";
import { currentBest, fmtValue, progressPct } from "../selectors";
import { type PREntry, type PRGoal } from "../types";

function SparkTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string } }>;
  unit: PRGoal["unit"];
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0];

  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="font-semibold">{fmtValue(point.value, unit)}</div>
      <div className="text-muted-foreground">{point.payload.date}</div>
    </div>
  );
}

function LogForm({
  unit,
  onSubmit,
  onCancel,
}: {
  unit: PRGoal["unit"];
  onSubmit: (value: number, notes: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState("");
  const [notes, setNotes] = useState("");

  const placeholder =
    unit === "seconds" ? "Seconds (e.g. 75 for 1:15)" : `Value in ${unit}`;

  return (
    <div className="mt-2 space-y-2 rounded-xl border bg-muted/20 p-3">
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-28 rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!val || Number(val) <= 0}
          onClick={() => onSubmit(Number(val), notes)}
        >
          Save PR
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function GoalEditor({
  current,
  unit,
  onSave,
  onCancel,
}: {
  current: number;
  unit: string;
  onSave: (val: number) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(String(current));

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        value={val}
        min={0}
        onChange={(e) => setVal(e.target.value)}
        className="w-20 rounded border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <span className="text-xs text-muted-foreground">{unit}</span>
      <button
        type="button"
        onClick={() => Number(val) > 0 && onSave(Number(val))}
        className="text-[10px] font-semibold text-emerald-500 hover:text-emerald-400"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[10px] text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </span>
  );
}

function HistoryRow({
  entry,
  index,
  unit,
  onDelete,
}: {
  entry: PREntry;
  index: number;
  unit: PRGoal["unit"];
  onDelete: (i: number) => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/30">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">
        {entry.date}
      </span>
      <span className="flex-1 text-sm font-semibold tabular-nums">
        {fmtValue(entry.value, unit)}
      </span>
      {entry.notes && (
        <span className="max-w-[120px] truncate text-xs italic text-muted-foreground">
          {entry.notes}
        </span>
      )}
      <button
        type="button"
        onClick={() => onDelete(index)}
        className="invisible ml-auto shrink-0 text-muted-foreground/40 hover:text-destructive group-hover:visible"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

interface PRCardProps {
  goal: PRGoal;
  onLog: (id: string, value: number, notes?: string) => void;
  onGoalUpdate: (id: string, goal: number) => void;
  onDelete: (id: string, index: number) => void;
  onRemove: (id: string) => void;
}

export function PRCard({
  goal,
  onLog,
  onGoalUpdate,
  onDelete,
  onRemove,
}: PRCardProps) {
  const [showLog, setShowLog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [editGoal, setEditGoal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const best = currentBest(goal.history);
  const pct = progressPct(best, goal.goal);

  const chartData = [...goal.history]
    .slice(0, 20)
    .reverse()
    .map((entry) => ({ date: entry.date, value: entry.value }));

  const trend =
    goal.history.length >= 2
      ? goal.history[0].value - goal.history[1].value
      : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-sm">{goal.label}</CardTitle>
              <span className="shrink-0 text-[10px] text-muted-foreground/60">
                {CATEGORY_LABELS[goal.category].split(" ")[0]}
              </span>
            </div>

            <CardDescription className="mt-0.5 text-xs">
              Goal:{" "}
              {editGoal ? (
                <GoalEditor
                  current={goal.goal}
                  unit={goal.unit}
                  onSave={(value) => {
                    onGoalUpdate(goal.id, value);
                    setEditGoal(false);
                  }}
                  onCancel={() => setEditGoal(false)}
                />
              ) : (
                <span>
                  {goal.goalLabel}{" "}
                  <button
                    type="button"
                    onClick={() => setEditGoal(true)}
                    className="inline-flex text-muted-foreground/50 hover:text-muted-foreground"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
            </CardDescription>
          </div>

          <div className="flex shrink-0 items-start gap-2">
            <div className="text-right">
              {best !== null ? (
                <>
                  <div className="text-xl font-bold leading-none tabular-nums">
                    {fmtValue(best, goal.unit)}
                  </div>

                  <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                    {trend !== null && trend !== 0 && (
                      <span
                        className={
                          trend > 0 ? "text-emerald-500" : "text-rose-500"
                        }
                      >
                        <TrendingUp
                          className={[
                            "inline h-2.5 w-2.5",
                            trend < 0 ? "rotate-180" : "",
                          ].join(" ")}
                        />{" "}
                        {trend > 0 ? "+" : ""}
                        {fmtValue(Math.abs(trend), goal.unit)}
                      </span>
                    )}
                    <span>PR</span>
                  </div>
                </>
              ) : (
                <div className="mt-1 text-xs italic text-muted-foreground">
                  No PR yet
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((open) => !open)}
                className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-6 z-20 min-w-[140px] rounded-xl border bg-popover py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onRemove(goal.id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive hover:bg-muted"
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
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={showLog ? "secondary" : "default"}
            onClick={() => setShowLog((v) => !v)}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Log PR
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHistory((v) => !v)}
            className="h-8 gap-1.5 text-xs"
          >
            {showHistory ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            History
          </Button>

          {goal.history.length >= 2 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChart((v) => !v)}
              className="h-8 gap-1.5 text-xs"
            >
              {showChart ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              Trend
            </Button>
          )}
        </div>

        {showLog && (
          <LogForm
            unit={goal.unit}
            onSubmit={(value, notes) => {
              onLog(goal.id, value, notes);
              setShowLog(false);
            }}
            onCancel={() => setShowLog(false)}
          />
        )}

        {showChart && chartData.length > 1 && (
          <div className="rounded-xl border bg-muted/10 p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              PR trend
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip content={<SparkTooltip unit={goal.unit} />} />
                  <ReferenceLine
                    y={goal.goal}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    opacity={0.25}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="currentColor"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="space-y-1 rounded-xl border bg-muted/10 p-2">
            {goal.history.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                No entries yet
              </div>
            ) : (
              goal.history.map((entry, index) => (
                <HistoryRow
                  key={`${entry.date}-${entry.value}-${index}`}
                  entry={entry}
                  index={index}
                  unit={goal.unit}
                  onDelete={(i) => onDelete(goal.id, i)}
                />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}