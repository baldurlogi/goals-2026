import { useEffect, useMemo, useState } from "react";
import {
  loadScheduleLog,
  getScheduleSummary,
  SCHEDULE_CHANGED_EVENT,
  type ScheduleLog,
} from "@/features/schedule/scheduleStorage";
import { dailySchedule } from "@/features/schedule/scheduleData";

const EMPTY: ScheduleLog = { date: "", view: "wfh", completed: [] };

export function useScheduleDashboard() {
  const [scheduleLog, setScheduleLog] = useState<ScheduleLog>(EMPTY);

  useEffect(() => {
    let alive = true;

    const sync = async () => {
      const next = await loadScheduleLog();
      if (!alive) return;
      setScheduleLog(next);
    };

    sync();

    window.addEventListener(SCHEDULE_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      alive = false;
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const config = dailySchedule[scheduleLog.view ?? "wfh"];

  const completedSet = useMemo(
    () => new Set(scheduleLog.completed ?? []),
    [scheduleLog.completed],
  );

  const summary = useMemo(
    () => getScheduleSummary(scheduleLog, config.blocks.length),
    [scheduleLog, config.blocks.length],
  );

  const nextBlockIndex = useMemo(
    () => config.blocks.findIndex((_, i) => !completedSet.has(i)),
    [config.blocks, completedSet],
  );

  const nextBlock = nextBlockIndex >= 0 ? config.blocks[nextBlockIndex] : null;
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