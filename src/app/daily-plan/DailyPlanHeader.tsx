import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";

type NavItem    = { label: string; href: string };
type NavSection = { label: string; items: NavItem[] };

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
      { label: "🎯 All Goals", href: "/goals" },
      { label: "📌 Upcoming",  href: "/upcoming" },
    ],
  },
  {
    label: "Other",
    items: [
      { label: "✅ To-do",    href: "/todos" },
      { label: "🏋️ Fitness", href: "/fitness" },
    ],
  },
];

// Derive initials from email or display name
function getInitials(user: { email?: string; user_metadata?: { full_name?: string; name?: string } } | null) {
  if (!user) return "?";
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (name) {
    return name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  }
  return (user.email ?? "?")[0].toUpperCase();
}

function getDisplayName(user: { email?: string; user_metadata?: { full_name?: string; name?: string } } | null) {
  if (!user) return "";
  return user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "";
}

export function DailyPlanHeader() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  const currentItem = NAV_SECTIONS
    .flatMap((s) => s.items)
    .find((i) => pathname.startsWith(i.href));

  const initials    = getInitials(user);
  const displayName = getDisplayName(user);
  const email       = user?.email ?? "";

  // Google avatar if available
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-10">

        {/* ── Brand ── */}
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

        <span className="text-border select-none">|</span>

        {/* ── Nav dropdown ── */}
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
                        pathname.startsWith(item.href) && "font-semibold",
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

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── User menu ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full ring-offset-background transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {initials}
                </div>
              )}
              <span className="hidden max-w-[140px] truncate text-sm font-medium md:block">
                {displayName || email}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* Identity block */}
            <div className="px-3 py-2">
              <p className="text-sm font-semibold leading-tight truncate">
                {displayName || "Account"}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {email}
              </p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem disabled className="gap-2 text-xs text-muted-foreground cursor-default">
              <User className="h-3.5 w-3.5" />
              Profile settings coming soon
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={signOut}
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}