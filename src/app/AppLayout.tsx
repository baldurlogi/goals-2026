import { Outlet } from "react-router-dom";
import { DailyPlanHeader } from "@/app/daily-plan/DailyPlanHeader";
import { Toaster } from "@/components/ui/sonner";


export function AppLayout() {
  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-background text-foreground">
        <DailyPlanHeader />
        <main className="w-full px-4 py-6 space-y-6 lg:px-10">
          <Outlet />
        </main>
      </div>
    </>
  );
}
