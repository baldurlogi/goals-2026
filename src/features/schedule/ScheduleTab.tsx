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
  DEFAULT_SCHEDULE_LOG, // <-- make sure scheduleStorage exports this (see note below)
} from "./scheduleStorage";

export function ScheduleTab() {
  const [log, setLog] = useState(DEFAULT_SCHEDULE_LOG);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const next = await loadScheduleLog();
      if (!cancelled) setLog(next);
    };

    // initial load
    sync();

    // refresh when we save
    window.addEventListener(SCHEDULE_CHANGED_EVENT, sync);

    return () => {
      cancelled = true;
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, sync);
    };
  }, []);

  const view: ScheduleView = log.view;
  const schedule = useMemo(() => dailySchedule[view], [view]);

  const summary = useMemo(
    () => getScheduleSummary(log, schedule.blocks.length),
    [log, schedule.blocks.length]
  );

  const completedSet = useMemo(() => new Set<number>(log.completed ?? []), [log.completed]);

  const handleViewChange = async (v: ScheduleView) => {
    await setTodayView(v);
    const next = await loadScheduleLog();
    setLog(next);
  };

  const handleToggleBlock = async (index: number, done: boolean) => {
    await toggleBlock(index, done);
    const next = await loadScheduleLog();
    setLog(next);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
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

          <div className="mt-3">
            <SchedulePicker value={view} onChange={handleViewChange} />
          </div>

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