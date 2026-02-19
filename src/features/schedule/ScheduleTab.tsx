import { useEffect, useMemo, useState } from "react";
import type { ScheduleView } from "./scheduleTypes";
import { dailySchedule } from "./scheduleData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SchedulePicker } from "./components/SchedulePicker";
import { TimelineList } from "./components/TimelineList";
import {
  loadScheduleLog,
  setTodayView,
  toggleBlock,
  getScheduleSummary,
  SCHEDULE_CHANGED_EVENT,
} from "./scheduleStorage";

export function ScheduleTab() {
  const [log, setLog] = useState(() => loadScheduleLog());

  useEffect(() => {
    const sync = () => setLog(loadScheduleLog());
    window.addEventListener(SCHEDULE_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const view: ScheduleView = log.view;
  const schedule    = useMemo(() => dailySchedule[view], [view]);
  const summary     = useMemo(() => getScheduleSummary(log, schedule.blocks.length), [log, schedule.blocks.length]);
  const completedSet = useMemo(() => new Set(log.completed), [log.completed]);

  const handleViewChange = (v: ScheduleView) => {
    setTodayView(v);
    setLog(loadScheduleLog());
  };

  const handleToggleBlock = (index: number, done: boolean) => {
    toggleBlock(index, done);
    setLog(loadScheduleLog());
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          {/* Row 1: title + counter */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{schedule.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap a row to expand · check off to track progress
              </p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {summary.done}/{summary.total} done
            </span>
          </div>

          {/* Row 2: day picker */}
          <div className="mt-3">
            <SchedulePicker value={view} onChange={handleViewChange} />
          </div>

          {/* Row 3: progress bar */}
          {summary.total > 0 && (
            <div className="mt-3 space-y-1">
              <Progress value={summary.pct} className="h-1.5" />
            </div>
          )}
        </CardHeader>

        <CardContent className="px-2 pb-3">
          <TimelineList
            schedule={schedule}
            completedSet={completedSet}
            onToggle={handleToggleBlock}
          />
        </CardContent>
      </Card>
    </div>
  );
}