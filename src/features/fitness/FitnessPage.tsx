import { useEffect, useState } from "react";
import { Dumbbell, Plus, Trash2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  loadFitness,
  logPR,
  updateGoal,
  deleteEntry,
  currentBest,
  progressPct,
  FITNESS_CHANGED_EVENT,
  type FitnessStore,
  type LiftId,
  type SkillId,
  type LiftRecord,
  type SkillRecord,
  type PREntry,
} from "@/features/fitness/fitnessStorage";

// ── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "lifts" | "crossfit" | "swimming";

// ── Log PR modal (inline form) ───────────────────────────────────────────────
function LogForm({
  unit,
  metricType,
  onSubmit,
  onCancel,
}: {
  unit: string;
  metricType: string;
  onSubmit: (value: number, notes: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal]     = useState("");
  const [notes, setNotes] = useState("");

  const placeholder =
    metricType === "seconds" ? "Time in seconds (e.g. 78)" :
    `Value in ${unit}`;

  return (
    <div className="mt-3 space-y-2 rounded-xl border bg-muted/30 p-3">
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
          Log PR
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Goal editor ───────────────────────────────────────────────────────────────
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
      >Save</button>
      <button type="button" onClick={onCancel} className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>
    </span>
  );
}

// ── History row ───────────────────────────────────────────────────────────────
function HistoryRow({
  entry, index, unit, metricType, onDelete,
}: {
  entry: PREntry; index: number; unit: string; metricType: string;
  onDelete: (i: number) => void;
}) {
  const displayVal =
    metricType === "seconds"
      ? `${Math.floor(entry.value / 60)}:${String(entry.value % 60).padStart(2, "0")}`
      : `${entry.value} ${unit}`;

  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/30">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{entry.date}</span>
      <span className="flex-1 text-sm font-semibold tabular-nums">{displayVal}</span>
      {entry.notes && <span className="text-xs text-muted-foreground italic truncate max-w-[120px]">{entry.notes}</span>}
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

// ── Single PR card ────────────────────────────────────────────────────────────
function PRCard({
  kind,
  record,
  onLog,
  onGoalSave,
  onDelete,
}: {
  kind: "lift" | "skill";
  record: LiftRecord | SkillRecord;
  onLog: (kind: "lift" | "skill", id: string, value: number, notes?: string) => void;
  onGoalSave: (kind: "lift" | "skill", id: string, goal: number) => void;
  onDelete: (kind: "lift" | "skill", id: string, index: number) => void;
}) {
  const [showLog,     setShowLog]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editGoal,    setEditGoal]    = useState(false);

  const unit       = record.unit;
  const metricType = kind === "skill" ? (record as SkillRecord).metricType : "number";
  const best       = currentBest(record.history);
  const pct        = progressPct(best, record.goal);
  const goalLabel  = kind === "skill" ? ((record as SkillRecord).goalLabel ?? `${record.goal} ${unit}`) : `${record.goal} ${unit}`;

  const displayBest =
    metricType === "seconds" && best !== null
      ? `${Math.floor(best / 60)}:${String(best % 60).padStart(2, "0")}`
      : best !== null
      ? `${best} ${unit}`
      : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">{record.label}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Goal:{" "}
              {editGoal ? (
                <GoalEditor
                  current={record.goal}
                  unit={unit}
                  onSave={(v) => { onGoalSave(kind, record.id, v); setEditGoal(false); }}
                  onCancel={() => setEditGoal(false)}
                />
              ) : (
                <span>
                  {goalLabel}{" "}
                  <button type="button" onClick={() => setEditGoal(true)} className="inline-flex text-muted-foreground/60 hover:text-muted-foreground">
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
            </CardDescription>
          </div>

          <div className="text-right shrink-0">
            {displayBest ? (
              <>
                <div className="text-lg font-bold tabular-nums leading-none">{displayBest}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">current PR</div>
              </>
            ) : (
              <div className="text-xs italic text-muted-foreground">No PR yet</div>
            )}
          </div>
        </div>

        {/* Progress toward goal */}
        <div className="mt-3 space-y-1">
          <Progress value={pct} className="h-1.5" />
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{pct}% to goal</span>
            {best !== null && best >= record.goal && (
              <span className="text-emerald-500 font-semibold">🎯 Goal hit!</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-1">
        {/* Log + History toggles */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showLog ? "default" : "outline"}
            className="h-7 gap-1 text-xs"
            onClick={() => { setShowLog((s) => !s); setShowHistory(false); }}
          >
            <Plus className="h-3 w-3" /> Log PR
          </Button>

          {record.history.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs text-muted-foreground"
              onClick={() => { setShowHistory((s) => !s); setShowLog(false); }}
            >
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              History ({record.history.length})
            </Button>
          )}
        </div>

        {showLog && (
          <LogForm
            unit={unit}
            metricType={metricType}
            onSubmit={(v, n) => { onLog(kind, record.id, v, n); setShowLog(false); }}
            onCancel={() => setShowLog(false)}
          />
        )}

        {showHistory && (
          <div className="mt-2 space-y-0.5 max-h-48 overflow-auto">
            {record.history.map((entry, i) => (
              <HistoryRow
                key={`${entry.date}-${i}`}
                entry={entry}
                index={i}
                unit={unit}
                metricType={metricType}
                onDelete={(idx) => onDelete(kind, record.id, idx)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function FitnessPage() {
  const [store, setStore] = useState<FitnessStore>(() => loadFitness());
  const [tab,   setTab]   = useState<Tab>("lifts");

  useEffect(() => {
    const sync = () => setStore(loadFitness());
    window.addEventListener(FITNESS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FITNESS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleLog = (kind: "lift" | "skill", id: string, value: number, notes?: string) => {
    logPR(kind, id as LiftId & SkillId, value, notes);
    setStore(loadFitness());
  };

  const handleGoalSave = (kind: "lift" | "skill", id: string, goal: number) => {
    updateGoal(kind, id as LiftId & SkillId, goal);
    setStore(loadFitness());
  };

  const handleDelete = (kind: "lift" | "skill", id: string, index: number) => {
    deleteEntry(kind, id as LiftId & SkillId, index);
    setStore(loadFitness());
  };

  const liftOrder: LiftId[]       = ["bench", "squat", "ohp", "clean", "snatch"];
  const crossfitOrder: SkillId[]  = ["butterfly_pullups", "muscle_ups", "strict_hspu", "freestanding_hspu", "hsw"];
  const swimmingOrder: SkillId[]  = ["swim_100m", "swim_200m"];

  const TABS: { id: Tab; label: string }[] = [
    { id: "lifts",    label: "🏋️ Lifts" },
    { id: "crossfit", label: "🤸 CrossFit" },
    { id: "swimming", label: "🏊 Swimming" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Dumbbell className="h-5 w-5 text-violet-500" />
        <div>
          <h1 className="text-xl font-semibold">PRs & Fitness</h1>
          <p className="text-sm text-muted-foreground">
            Track personal records, goals and history across lifts and skills.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lifts tab */}
      {tab === "lifts" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liftOrder.map((id) => (
            <PRCard
              key={id}
              kind="lift"
              record={store.lifts[id]}
              onLog={handleLog}
              onGoalSave={handleGoalSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* CrossFit tab */}
      {tab === "crossfit" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {crossfitOrder.map((id) => (
            <PRCard
              key={id}
              kind="skill"
              record={store.skills[id]}
              onLog={handleLog}
              onGoalSave={handleGoalSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Swimming tab */}
      {tab === "swimming" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {swimmingOrder.map((id) => (
            <PRCard
              key={id}
              kind="skill"
              record={store.skills[id]}
              onLog={handleLog}
              onGoalSave={handleGoalSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}