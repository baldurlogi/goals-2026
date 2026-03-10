import { Outlet } from "react-router-dom";
import { DailyPlanHeader } from "@/features/daily-plan/components/DailyPlanHeader";
import { ThemeProvider } from "./providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { clearStaleDailyCaches } from "@/hooks/useTodayDate";

// Clear stale date-keyed caches immediately at module load time,
// before any dashboard hooks read from localStorage.
clearStaleDailyCaches();

export function AppLayout() {
  return (
    <ThemeProvider>
      <Toaster />
      <div className="min-h-screen bg-background text-foreground">
        <DailyPlanHeader />
        <main className="w-full px-4 py-6 space-y-6 lg:px-10">
          <Outlet />
        </main>
      </div>
      <PWAInstallBanner />
    </ThemeProvider>
  );
}