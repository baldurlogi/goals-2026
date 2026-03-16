import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { DailyPlanHeader } from "@/features/daily-plan/components/DailyPlanHeader";
import { ThemeProvider } from "./providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { clearStaleDailyCaches } from "@/hooks/useTodayDate";

function scheduleIdle(callback: () => void, delay = 0) {
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
      idleId = w.requestIdleCallback(callback, { timeout: 1500 });
      return;
    }

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

export function AppLayout() {
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  useEffect(() => {
    clearStaleDailyCaches();

    const cancelIdle = scheduleIdle(() => {
      setShowPwaBanner(true);
    }, 1200);

    return cancelIdle;
  }, []);

  return (
    <ThemeProvider>
      <Toaster />
      <div className="min-h-screen bg-background text-foreground">
        <DailyPlanHeader />
        <main className="w-full space-y-6 px-4 py-6 lg:px-10">
          <Outlet />
        </main>
      </div>
      {showPwaBanner ? <PWAInstallBanner /> : null}
    </ThemeProvider>
  );
}