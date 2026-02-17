import { useEffect, useMemo, useState } from "react";
import {
  loadScheduleLog,
  getScheduleSummary,
  SCHEDULE_CHANGED_EVENT,
} from "@/features/schedule/scheduleStorage";
import { dailySchedule } from "@/features/schedule/scheduleData";
import type { ScheduleLog } from "@/features/schedule/scheduleStorage";

export function useScheduleDashboard() {
  const [scheduleLog, setScheduleLog] = useState<ScheduleLog>(() => loadScheduleLog());

  useEffect(() => {
    const sync = () => setScheduleLog(loadScheduleLog());
    window.addEventListener(SCHEDULE_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const config = dailySchedule[scheduleLog.view];

  const completedSet = useMemo(
    () => new Set(scheduleLog.completed),
    [scheduleLog.completed],
  );

  const summary = useMemo(
    () => getScheduleSummary(scheduleLog, config.blocks.length),
    [scheduleLog, config.blocks.length],
  );

  // First incomplete block is "next up"
  const nextBlockIndex = useMemo(
    () => config.blocks.findIndex((_, i) => !completedSet.has(i)),
    [config.blocks, completedSet],
  );

  const nextBlock = nextBlockIndex >= 0 ? config.blocks[nextBlockIndex] : null;

  // First 5 blocks shown as a preview in the dashboard card
  const previewBlocks = config.blocks.slice(0, 5);

  const viewLabel =
    scheduleLog.view === "wfh"
      ? "WFH day"
      : scheduleLog.view === "office"
      ? "Office day"
      : "Weekend";

  return {
    scheduleLog,
    config,
    completedSet,
    summary,
    nextBlock,
    nextBlockIndex,
    previewBlocks,
    viewLabel,
    totalBlocks: config.blocks.length,
  };
}