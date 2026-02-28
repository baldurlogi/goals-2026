import { useEffect, useMemo, useState } from "react";
import {
  loadScheduleLog,
  getScheduleSummary,
  SCHEDULE_CHANGED_EVENT,
  type ScheduleLog,
} from "@/features/schedule/scheduleStorage";
import { dailySchedule } from "@/features/schedule/scheduleData";

const CACHE_KEY = "cache:schedule_log:v1";

function readCache(): ScheduleLog {
  try {
    const raw   = localStorage.getItem(CACHE_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (!raw) return { date: today, view: "wfh", completed: [] };
    const parsed = JSON.parse(raw) as ScheduleLog;
    if (parsed.date !== today) return { date: today, view: "wfh", completed: [] };
    return parsed;
  } catch { return { date: new Date().toISOString().slice(0, 10), view: "wfh", completed: [] }; }
}

export function useScheduleDashboard() {
  const [scheduleLog, setScheduleLog] = useState<ScheduleLog>(readCache);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const fresh = await loadScheduleLog();
      if (!cancelled) {
        setScheduleLog(fresh);
        setLoading(false);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch {}
      }
    }

    fetch();

    const sync = () => fetch();
    window.addEventListener(SCHEDULE_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const config       = dailySchedule[scheduleLog.view];
  const completedSet = useMemo(() => new Set(scheduleLog.completed), [scheduleLog.completed]);
  const summary      = useMemo(
    () => getScheduleSummary(scheduleLog, config.blocks.length),
    [scheduleLog, config.blocks.length],
  );

  const nextBlockIndex = useMemo(
    () => config.blocks.findIndex((_, i) => !completedSet.has(i)),
    [config.blocks, completedSet],
  );

  const nextBlock     = nextBlockIndex >= 0 ? config.blocks[nextBlockIndex] : null;
  const previewBlocks = config.blocks.slice(0, 5);
  const viewLabel     =
    scheduleLog.view === "wfh" ? "WFH day" :
    scheduleLog.view === "office" ? "Office day" : "Weekend";

  return {
    scheduleLog, config, completedSet, summary,
    nextBlock, nextBlockIndex, previewBlocks,
    viewLabel, totalBlocks: config.blocks.length,
    loading,
  };
}