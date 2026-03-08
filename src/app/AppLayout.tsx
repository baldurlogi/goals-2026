import { Outlet } from "react-router-dom";
import { DailyPlanHeader } from "@/app/daily-plan/DailyPlanHeader";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { AchievementModal } from "@/features/achievements/AchievementModal";

export function AppLayout() {
  return (
    <ThemeProvider>
      <Toaster />
      <AchievementModal />
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