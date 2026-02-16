import { Outlet } from "react-router-dom";
import { DailyPlanHeader } from "@/app/DailyPlan/DailyPlanHeader";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DailyPlanHeader />
      <main className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
        <Outlet />
      </main>
    </div>
  );
}
