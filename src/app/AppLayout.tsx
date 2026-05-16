import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { DailyPlanHeader } from "./navigation/DailyPlanHeader";
import { ThemeProvider } from "./providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { clearStaleDailyCaches } from "@/hooks/useTodayDate";
import { scheduleIdle } from "@/lib/scheduleIdle";
import { useAuth } from "@/features/auth/authContext";
import { captureReturnedNextDay } from "@/lib/analytics";

export function AppLayout() {
  const { userId } = useAuth();
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  useEffect(() => {
    captureReturnedNextDay(userId);
    clearStaleDailyCaches();

    const cancelIdle = scheduleIdle(() => {
      setShowPwaBanner(true);
    }, 1200, 1500);

    return cancelIdle;
  }, [userId]);

  return (
    <ThemeProvider>
      <Toaster />
      <div className="min-h-screen overflow-x-clip bg-background text-foreground">
        <DailyPlanHeader />
        <main className="w-full min-w-0 max-w-full overflow-x-clip space-y-6 px-4 pb-24 pt-6 md:pb-6 lg:px-10">
          <Outlet />
        </main>
      </div>
      {showPwaBanner ? <PWAInstallBanner /> : null}
    </ThemeProvider>
  );
}
