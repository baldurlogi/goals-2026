// DailyPlanLayout.tsx
import { Outlet, NavLink, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function TabLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "rounded-md px-3 py-2 text-sm font-medium text-center transition-colors",
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
      <div className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card p-2">
        <div className="flex items-center gap-2">
          <TabLink to="/daily-plan/nutrition">🥗 Nutrition</TabLink>
          <TabLink to="/daily-plan/schedule">📅 Schedule</TabLink>
          <TabLink to="/daily-plan/reading">📖 Reading</TabLink>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">More</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/upcoming">📌 Upcoming</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/goals">🎯 Goals</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Outlet />
    </div>
  );
}
