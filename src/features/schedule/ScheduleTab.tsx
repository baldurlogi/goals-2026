/**
 * ScheduleTab.tsx — wired to scheduleStorage
 *
 * Changes from original:
 *  - View selection is persisted: choosing WFH/Office/Weekend saves to localStorage
 *    and auto-infers from the current weekday on first visit
 *  - Each timeline block can be checked off as "done"
 *  - A progress summary is shown at the top (X / Y blocks done)
 *  - Dashboard picks up changes via the SCHEDULE_CHANGED_EVENT
 */

import { useEffect, useMemo, useState } from "react";
import type { ScheduleView } from "./scheduleTypes";
import { dailySchedule } from "./scheduleData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SchedulePicker } from "./components/SchedulePicker";
import { Separator } from "@/components/ui/separator";
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

  // Keep in sync with other tabs / windows
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
  const schedule = useMemo(() => dailySchedule[view], [view]);

  const summary = useMemo(
    () => getScheduleSummary(log, schedule.blocks.length),
    [log, schedule.blocks.length],
  );

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
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">Daily Schedule</CardTitle>
            {summary.total > 0 && (
              <Badge
                variant="secondary"
                className="tabular-nums text-xs"
              >
                {summary.done} / {summary.total} done
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <SchedulePicker value={view} onChange={handleViewChange} />

          {/* Day progress bar */}
          {summary.total > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Day progress</span>
                <span className="tabular-nums font-medium">{summary.pct}%</span>
              </div>
              <Progress value={summary.pct} className="h-2" />
            </div>
          )}

          <Separator />

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