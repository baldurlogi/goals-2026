import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type NavItem = { label: string; href: string };
type NavSection = { label: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Daily Plan",
    items: [
      { label: "📖 Reading",   href: "/daily-plan/reading" },
      { label: "🥗 Nutrition", href: "/daily-plan/nutrition" },
      { label: "📅 Schedule",  href: "/daily-plan/schedule" },
    ],
  },
  {
    label: "Goals",
    items: [
      { label: "🎯 All Goals",  href: "/goals" },
      { label: "📌 Upcoming",   href: "/upcoming" },
    ],
  },
  {
    label: "Other",
    items: [
      { label: "✅ To-do", href: "/todos"}
    ]
  }
];

export function DailyPlanHeader() {
  const { pathname } = useLocation();

  // Derive a readable current-section label for the dropdown trigger
  const currentItem = NAV_SECTIONS
    .flatMap((s) => s.items)
    .find((i) => pathname.startsWith(i.href)); 

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-10">

        {/* --- Brand / Dashboard home --- */}
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 text-sm font-semibold transition-colors hover:text-foreground",
            pathname === "/" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        {/* --- Divider --- */}
        <span className="text-border select-none">|</span>

        {/* --- Section dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2 text-sm font-medium"
            >
              {currentItem ? currentItem.label : "Navigate"}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-48">
            {NAV_SECTIONS.map((section, i) => (
              <div key={section.label}>
                {i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {section.label}
                </DropdownMenuLabel>
                {section.items.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "cursor-pointer",
                        pathname.startsWith(item.href) && "font-semibold"
                      )}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* --- Spaced --- */}
        <div className="flex-1" />

        {/* --- Identity --- */}
        <p className="hidden text-xs text-muted-foreground md:block">
          Male · 25yo · 78kg · 180cm
        </p>
      </div>
    </header>
  );
}