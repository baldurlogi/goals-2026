import { useEffect, useRef, useState } from "react";
import { Check, Flame, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAY_KEYS, REST_LABELS } from "../constants";
import { todayISO } from "../date";
import { type DayKey, type WeeklySplitConfig } from "../types";
import {
  loadWeeklySplit,
  readSplitCache,
  toggleDayCompletion,
  updateDayLabel,
  todayDayKey,
} from "../weeklySplitStorage";

export function WeeklySplitCard() {
  const [cfg, setCfg] = useState<WeeklySplitConfig>(() => readSplitCache());
  const [editingDay, setEditingDay] = useState<DayKey | null>(null);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const today = todayISO();
  const todayKey = todayDayKey();

  useEffect(() => {
    void loadWeeklySplit().then(setCfg);
  }, []);

  useEffect(() => {
    if (editingDay && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingDay]);

  async function handleToggle(day: DayKey) {
    const next = await toggleDayCompletion(cfg, day);
    setCfg(next);

    if (day === todayKey) {
      const wasCompleted = cfg.days[day].completedDate === today;
      if (!wasCompleted) {
        toast.success("Day checked — streak updated! 🔥");
      }
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
    (dk) => cfg.days[dk].completedDate !== null,
  ).length;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Weekly Split</CardTitle>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="tabular-nums font-medium text-foreground">
              {thisWeekCount}
            </span>
            <span>/ 7 done</span>
          </div>
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          Tap a day to mark it done. Edit labels to customise your plan.
        </p>
      </CardHeader>

      <CardContent className="space-y-1 px-4 pb-4">
        {DAY_KEYS.map((dk) => {
          const day = cfg.days[dk];
          const isToday = dk === todayKey;
          const isDone = day.completedDate !== null;
          const isRest = REST_LABELS.has(day.label.toLowerCase());
          const isEditing = editingDay === dk;

          return (
            <div
              key={dk}
              onClick={() => !isEditing && void handleToggle(dk)}
              className={[
                "group flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                isToday
                  ? "border border-violet-500/30 bg-violet-500/10"
                  : "hover:bg-muted/40",
                isDone ? "ring-1 ring-emerald-500/20" : "",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                    : isToday
                      ? "border-violet-500/30 bg-violet-500/15 text-violet-400"
                      : "border-border text-muted-foreground",
                ].join(" ")}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : dk}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => void commitEdit(dk)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void commitEdit(dk);
                        if (e.key === "Escape") setEditingDay(null);
                      }}
                      className="w-full rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  ) : (
                    <>
                      <span
                        className={[
                          "truncate text-sm font-medium",
                          isRest ? "text-muted-foreground" : "text-foreground",
                        ].join(" ")}
                      >
                        {day.label}
                      </span>

                      {isToday && (
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                          Today
                        </span>
                      )}
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {isDone ? (
                      <span>Completed {day.completedDate}</span>
                    ) : isRest ? (
                      <span>Recovery / off day</span>
                    ) : (
                      <span>Tap to mark complete</span>
                    )}
                  </div>
                )}
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => startEdit(dk, e)}
                  className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}

        <div className="mt-3 flex items-center gap-2 rounded-xl border bg-muted/20 px-3 py-2.5">
          <Flame className="h-4 w-4 text-orange-400" />
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium">Current streak</span>
            <span className="tabular-nums font-semibold text-foreground">
              {cfg.streak}
            </span>
            <span className="text-muted-foreground">day(s)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}