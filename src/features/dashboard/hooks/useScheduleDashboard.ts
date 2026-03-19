import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/authContext";
import {
  loadScheduleLog,
  loadScheduleTemplates,
  getScheduleSummary,
  seedScheduleLog,
  seedScheduleTemplates,
  SCHEDULE_CHANGED_EVENT,
  SCHEDULE_TEMPLATE_EVENT,
  type ScheduleLog,
} from "@/features/schedule/scheduleStorage";
import {
  DEFAULT_USER_SCHEDULE,
  buildScheduleConfig,
} from "@/features/schedule/scheduleData";
import type {
  TimelineItem,
  UserScheduleTemplates,
} from "@/features/schedule/scheduleTypes";
import { useTodayDate } from "@/hooks/useTodayDate";

function emptyScheduleLogForToday(today: string): ScheduleLog {
  return {
    date: today,
    view: "wfh",
    completed: [],
  };
}

export function useScheduleDashboard() {
  const today = useTodayDate();
  const { userId, authReady } = useAuth();

  const [scheduleLog, setScheduleLog] = useState<ScheduleLog>(() =>
    authReady && userId
      ? seedScheduleLog(userId)
      : emptyScheduleLogForToday(today),
  );
  const [templates, setTemplates] = useState<UserScheduleTemplates>(() =>
    authReady && userId ? seedScheduleTemplates(userId) : DEFAULT_USER_SCHEDULE,
  );
  const [loading, setLoading] = useState(() =>
    authReady ? Boolean(userId) : true,
  );

  useEffect(() => {
    if (!authReady) {
      setLoading(true);
      return;
    }

    if (!userId) {
      setScheduleLog(emptyScheduleLogForToday(today));
      setTemplates(DEFAULT_USER_SCHEDULE);
      setLoading(false);
      return;
    }

    setScheduleLog(seedScheduleLog(userId));
    setTemplates(seedScheduleTemplates(userId));
    setLoading(true);
  }, [authReady, today, userId]);

  const load = useCallback(async () => {
    if (!authReady) return;

    if (!userId) {
      setScheduleLog(emptyScheduleLogForToday(today));
      setTemplates(DEFAULT_USER_SCHEDULE);
      setLoading(false);
      return;
    }

    try {
      const [freshLog, freshTemplates] = await Promise.all([
        loadScheduleLog(userId),
        loadScheduleTemplates(userId),
      ]);

      setScheduleLog(freshLog);
      setTemplates(freshTemplates);
    } catch (e) {
      console.warn("schedule dashboard load failed", e);
    } finally {
      setLoading(false);
    }
  }, [authReady, today, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!authReady) return;

    const handleChange = () => {
      void load();
    };

    window.addEventListener(SCHEDULE_CHANGED_EVENT, handleChange);
    window.addEventListener(SCHEDULE_TEMPLATE_EVENT, handleChange);

    return () => {
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, handleChange);
      window.removeEventListener(SCHEDULE_TEMPLATE_EVENT, handleChange);
    };
  }, [authReady, load]);

  const blocks =
    templates[scheduleLog.view] ?? DEFAULT_USER_SCHEDULE[scheduleLog.view];
  const config = buildScheduleConfig(scheduleLog.view, blocks);

  const completedSet = useMemo(
    () => new Set(scheduleLog.completed),
    [scheduleLog.completed],
  );

  const summary = useMemo(
    () => getScheduleSummary(scheduleLog, config.blocks.length),
    [scheduleLog, config.blocks.length],
  );

  const nextBlockIndex = useMemo(
    () => config.blocks.findIndex((_: TimelineItem, i: number) => !completedSet.has(i)),
    [completedSet, config.blocks],
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