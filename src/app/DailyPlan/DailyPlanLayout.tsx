import { Outlet, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

function TabLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex-1 rounded-md px-3 py-2 text-sm font-medium text-center transition-colors",
          "hover:bg-muted/40",
          isActive ? "bg-muted text-foreground" : "text-muted-foreground"
        )
      }
    >
      {children}
    </NavLink>
  );
}

export default function DailyPlanLayout() {
  return (
    <div className="space-y-6">
      <div className="flex w-full gap-2 rounded-lg border bg-card p-2">
        <TabLink to="/daily-plan/nutrition">🥗 Nutrition</TabLink>
        <TabLink to="/daily-plan/schedule">📅 Schedule</TabLink>
        <TabLink to="/daily-plan/reading">📖 Reading</TabLink>
        <TabLink to="/daily-plan/goals">🎯 Goals</TabLink>
      </div>

      <Outlet />
    </div>
  );
}
