export function scheduleIdle(
  callback: () => void,
  delay = 0,
  timeout = 1200
) {
  let timeoutId: number | null = null;
  let idleId: number | null = null;

  const run = () => {
    const w = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        options?: { timeout: number }
      ) => number;
    };

    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(callback, { timeout });
      return;
    }

    // Fallback for browsers without requestIdleCallback support.
    timeoutId = window.setTimeout(callback, 1);
  };

  timeoutId = window.setTimeout(run, delay);

  return () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    const w = window as Window & {
      cancelIdleCallback?: (id: number) => void;
    };

    if (idleId !== null && typeof w.cancelIdleCallback === "function") {
      w.cancelIdleCallback(idleId);
    }
  };
}
