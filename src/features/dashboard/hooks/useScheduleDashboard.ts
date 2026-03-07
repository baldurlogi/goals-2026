import { useEffect, useMemo, useState } from "react";
import {
  loadScheduleLog,
  getScheduleSummary,
  SCHEDULE_CHANGED_EVENT,
  type ScheduleLog,
} from "@/features/schedule/scheduleStorage";
import {
  DEFAULT_USER_SCHEDULE,
  buildScheduleConfig,
} from "@/features/schedule/scheduleData";
import type { TimelineItem } from "@/features/schedule/scheduleTypes";

const CACHE_KEY = "cache:schedule_log:v1";

function emptyScheduleLogForToday(): ScheduleLog {
  return {
    date: new Date().toISOString().slice(0, 10),
    view: "wfh",
    completed: [],
  };
}

function readCache(): ScheduleLog {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const today = new Date().toISOString().slice(0, 10);

    if (!raw) return emptyScheduleLogForToday();

    const parsed = JSON.parse(raw) as ScheduleLog;
    if (parsed.date !== today) return emptyScheduleLogForToday();

    return parsed;
  } catch {
    return emptyScheduleLogForToday();
  }
}

export function useScheduleDashboard() {
  const [scheduleLog, setScheduleLog] = useState<ScheduleLog>(readCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSchedule() {
      const fresh = await loadScheduleLog();

      if (!cancelled) {
        setScheduleLog(fresh);
        setLoading(false);

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
        } catch (e) {
          console.warn("write cache failed", e);
        }
      }
    }

    fetchSchedule();

    const sync = () => {
      void fetchSchedule();
    };

    window.addEventListener(SCHEDULE_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      cancelled = true;
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const blocks = DEFAULT_USER_SCHEDULE[scheduleLog.view];
  const config = buildScheduleConfig(scheduleLog.view, blocks);

  const completedSet = useMemo(
    () => new Set(scheduleLog.completed),
    [scheduleLog.completed]
  );

  const summary = useMemo(
    () => getScheduleSummary(scheduleLog, config.blocks.length),
    [scheduleLog, config.blocks.length]
  );

  const nextBlockIndex = useMemo(
    () => config.blocks.findIndex((_: TimelineItem, i: number) => !completedSet.has(i)),
    [config.blocks, completedSet]
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
    loading,
  };
}