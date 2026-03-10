import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  DAY_KEYS,
  type DayKey,
  type WeeklySplitConfig,
  loadWeeklySplit,
  readSplitCache,
  toggleDayCompletion,
  updateDayLabel,
  todayISO,
  todayDayKey,
} from "@/features/fitness/fitnessStorage";

const REST_LABELS = new Set(["rest", "off", "rest day"]);

export function WeeklySplitCard() {
  const [cfg, setCfg] = useState<WeeklySplitConfig>(() => readSplitCache());
  const [editingDay, setEditingDay] = useState<DayKey | null>(null);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const today = todayISO();
  const todayKey = todayDayKey();

  useEffect(() => {
    loadWeeklySplit().then(setCfg);
  }, []);

  useEffect(() => {
    if (editingDay && inputRef.current) inputRef.current.focus();
  }, [editingDay]);

  async function handleToggle(day: DayKey) {
    const next = await toggleDayCompletion(cfg, day);
    setCfg(next);
    if (day === todayKey) {
      const wasCompleted = cfg.days[day].completedDate === today;
      if (!wasCompleted) toast.success("Day checked — streak updated! 🔥");
    }
  }

  function startEdit(day: DayKey, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingDay(day);
    setEditVal(cfg.days[day].label);
  }

  async function commitEdit(day: DayKey) {
    const label = editVal.trim();
    if (label && label !== cfg.days[day].label) {
      const next = await updateDayLabel(cfg, day, label);
      setCfg(next);
    }
    setEditingDay(null);
  }

  const thisWeekCount = DAY_KEYS.filter(
    (dk) => cfg.days[dk].completedDate !== null
  ).length;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Weekly Split</CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="tabular-nums font-medium text-foreground">{thisWeekCount}</span>
            <span>/ 7 done</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tap a day to mark it done. Edit labels to customise your plan.
        </p>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-1">
        {DAY_KEYS.map((dk) => {
          const day = cfg.days[dk];
          const isToday = dk === todayKey;
          const isDone = day.completedDate !== null;
          const isRest = REST_LABELS.has(day.label.toLowerCase());
          const isEditing = editingDay === dk;

          return (
            <div
              key={dk}
              onClick={() => !isEditing && handleToggle(dk)}
              className={[
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all select-none",
                isToday
                  ? "bg-foreground/5 ring-1 ring-foreground/20"
                  : "hover:bg-muted/40",
                isDone && !isRest ? "opacity-100" : "",
              ].join(" ")}
            >
              {/* Checkbox */}
              <div
                className={[
                  "h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all",
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isToday
                    ? "border-foreground/50"
                    : "border-muted-foreground/30",
                ].join(" ")}
              >
                {isDone && <Check className="h-3 w-3 stroke-[3]" />}
              </div>

              {/* Day name */}
              <span
                className={[
                  "w-8 shrink-0 text-sm font-semibold tabular-nums",
                  isToday ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {dk}
              </span>

              {/* Label (editable) */}
              <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onBlur={() => commitEdit(dk)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(dk);
                      if (e.key === "Escape") setEditingDay(null);
                    }}
                    className="w-full rounded-md border bg-background px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                ) : (
                  <span
                    className={[
                      "text-sm",
                      isRest ? "text-muted-foreground/60 italic" : isDone ? "line-through text-muted-foreground" : "text-foreground",
                    ].join(" ")}
                  >
                    {day.label}
                  </span>
                )}
              </div>

              {/* Today badge */}
              {isToday && !isEditing && (
                <span className="shrink-0 rounded-full bg-foreground text-background text-[10px] font-semibold px-2 py-0.5">
                  Today
                </span>
              )}

              {/* Edit pencil */}
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => startEdit(dk, e)}
                  className="shrink-0 invisible group-hover:visible text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Streak footer */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Flame className={[
              "h-4 w-4",
              cfg.streak > 0 ? "text-orange-500" : "text-muted-foreground/40",
            ].join(" ")} />
            <span className="text-sm font-semibold tabular-nums">{cfg.streak}</span>
            <span className="text-xs text-muted-foreground">day streak</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {cfg.lastStreakDate
              ? `Last: ${cfg.lastStreakDate}`
              : "No workouts yet"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}