import { useEffect, useMemo, useRef, useState } from "react";
import {
  WATER_CHANGED_EVENT,
  defaultWaterLog,
  loadWaterLog,
  readWaterCache,
  saveWaterLog,
  todayKey,
  type WaterLog,
} from "@/features/water/waterStorage";

export function useWaterDashboard() {
  const date = todayKey();
  const cached = readWaterCache(date);

  const [log, setLog] = useState<WaterLog>(() => cached ?? defaultWaterLog(date));
  const [loading, setLoading] = useState<boolean>(() => cached === null);

  const logRef = useRef(log);

  useEffect(() => {
    logRef.current = log;
  }, [log]);

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      void loadWaterLog(date).then((fresh) => {
        if (cancelled) return;
        setLog(fresh);
        setLoading(false);
      });
    };

    sync();

    const onChanged = () => {
      sync();
    };

    window.addEventListener(WATER_CHANGED_EVENT, onChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(WATER_CHANGED_EVENT, onChanged);
    };
  }, [date]);

  const progressPct = useMemo(() => {
    if (log.targetMl <= 0) return 0;
    return Math.round((log.ml / log.targetMl) * 100);
  }, [log.ml, log.targetMl]);

  const fillPct = useMemo(
    () => Math.max(0, Math.min(progressPct, 100)),
    [progressPct],
  );

  const remainingMl = useMemo(
    () => Math.max(log.targetMl - log.ml, 0),
    [log.targetMl, log.ml],
  );

  const glasses = useMemo(
    () => Math.round((log.ml / 250) * 10) / 10,
    [log.ml],
  );

  const goalHit = log.ml >= log.targetMl;

  async function persist(next: WaterLog) {
    setLog(next);
    await saveWaterLog(next);
  }

  async function addQuick(amountMl: number) {
    const current = logRef.current;
    await persist({
      ...current,
      ml: Math.max(0, current.ml + amountMl),
    });
  }

  async function resetToday() {
    const current = logRef.current;
    await persist({
      ...current,
      ml: 0,
    });
  }

  return {
    log,
    loading,
    progressPct,
    fillPct,
    remainingMl,
    glasses,
    goalHit,
    addQuick,
    resetToday,
  };
}