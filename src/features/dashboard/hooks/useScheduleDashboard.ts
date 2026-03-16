import { useCallback, useMemo, useState } from 'react';
import {
  loadScheduleLog,
  getScheduleSummary,
  SCHEDULE_CHANGED_EVENT,
  SCHEDULE_LOG_CACHE_KEY,
  type ScheduleLog,
} from '@/features/schedule/scheduleStorage';
import {
  DEFAULT_USER_SCHEDULE,
  buildScheduleConfig,
} from '@/features/schedule/scheduleData';
import type { TimelineItem } from '@/features/schedule/scheduleTypes';
import { useTodayDate } from '@/hooks/useTodayDate';
import {
  hasDateAwareCache,
  readDateAwareCache,
  writeDateAwareCache,
  loadWithWriteThrough,
} from '@/lib/cache';
import { useDashboardLoadSubscription } from '@/features/dashboard/hooks/useDashboardLoadSubscription';

const SCHEDULE_EVENTS = [SCHEDULE_CHANGED_EVENT] as const;
const SCHEDULE_STORAGE_KEYS = [SCHEDULE_LOG_CACHE_KEY] as const;

function emptyScheduleLogForToday(today: string): ScheduleLog {
  return {
    date: today,
    view: 'wfh',
    completed: [],
  };
}

export function useScheduleDashboard() {
  const today = useTodayDate();
  const [scheduleLog, setScheduleLog] = useState<ScheduleLog>(() =>
    readDateAwareCache(SCHEDULE_LOG_CACHE_KEY, today, emptyScheduleLogForToday(today)),
  );
  const [loading, setLoading] = useState(
    () => !hasDateAwareCache(SCHEDULE_LOG_CACHE_KEY, today),
  );

  const load = useCallback(async () => {
    try {
      const fresh = await loadWithWriteThrough(loadScheduleLog, (value) =>
        writeDateAwareCache(SCHEDULE_LOG_CACHE_KEY, value),
      );
      setScheduleLog(fresh);
    } catch (e) {
      console.warn('schedule dashboard load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useDashboardLoadSubscription({
    load,
    events: SCHEDULE_EVENTS,
    storageKeys: SCHEDULE_STORAGE_KEYS,
  });

  const blocks = DEFAULT_USER_SCHEDULE[scheduleLog.view];
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
    [config.blocks, completedSet],
  );

  const nextBlock = nextBlockIndex >= 0 ? config.blocks[nextBlockIndex] : null;
  const previewBlocks = config.blocks.slice(0, 5);

  const viewLabel =
    scheduleLog.view === 'wfh'
      ? 'WFH day'
      : scheduleLog.view === 'office'
        ? 'Office day'
        : 'Weekend';

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
