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
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Moon,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/authContext";
import { useTheme } from "@/app/providers/theme-context";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import {
  ALL_MODULES,
  ALWAYS_NAV_ITEMS,
  type ModuleDef,
} from "@/features/modules/modules";
import { useTier, TIER_LABELS, TIER_BADGE } from "@/features/subscription/useTier";

function getInitials(
  user: {
    email?: string;
    user_metadata?: { full_name?: string; name?: string };
  } | null,
) {
  if (!user) return "?";

  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (name) {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (user.email ?? "?")[0].toUpperCase();
}

function getDisplayName(
  user: {
    email?: string;
    user_metadata?: { full_name?: string; name?: string };
  } | null,
) {
  if (!user) return "";
  return (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    ""
  );
}

type NavItem = {
  label: string;
  href: string;
  icon: ModuleDef["icon"];
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export function DailyPlanHeader() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { modules } = useEnabledModules();
  const tier = useTier();

  const enabledDefs = ALL_MODULES.filter((m) => modules.has(m.id));

  const dailyItems: NavItem[] = enabledDefs
    .filter((m) => m.section === "Daily Plan")
    .map((m) => ({
      label: m.navLabel,
      href: m.href,
      icon: m.icon,
    }));

  const goalsItems: NavItem[] = modules.has("goals")
    ? [
        {
          label: "All Goals",
          href: "/app/goals",
          icon: ALL_MODULES.find((m) => m.id === "goals")!.icon,
        },
        {
          label: ALWAYS_NAV_ITEMS[0].label,
          href: ALWAYS_NAV_ITEMS[0].href,
          icon: ALWAYS_NAV_ITEMS[0].icon,
        },
      ]
    : [];

  const otherItems: NavItem[] = enabledDefs
    .filter((m) => m.section === "Other")
    .map((m) => ({
      label: m.navLabel,
      href: m.href,
      icon: m.icon,
    }));

  const sections: NavSection[] = [
    ...(dailyItems.length > 0
      ? [{ label: "Daily Plan", items: dailyItems }]
      : []),
    ...(goalsItems.length > 0 ? [{ label: "Goals", items: goalsItems }] : []),
    ...(otherItems.length > 0 ? [{ label: "Other", items: otherItems }] : []),
  ];

  const currentItem = sections
    .flatMap((s) => s.items)
    .find((i) => pathname.startsWith(i.href));

  const initials = getInitials(user);
  const displayName = getDisplayName(user);
  const email = user?.email ?? "";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const CurrentIcon = currentItem?.icon;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-10">
        <Link
          to="/app"
          className={cn(
            "flex items-center gap-2 text-sm font-semibold transition-colors hover:text-foreground",
            pathname === "/app" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <span className="select-none text-border">|</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2 text-sm font-medium"
            >
              {currentItem && CurrentIcon ? (
                <>
                  <CurrentIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{currentItem.label}</span>
                </>
              ) : (
                "Navigate"
              )}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            {sections.length === 0 ? (
              <DropdownMenuItem asChild>
                <Link to="/app/profile">Configure modules</Link>
              </DropdownMenuItem>
            ) : (
              sections.map((section, i) => (
                <div key={section.label}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {section.label}
                  </DropdownMenuLabel>

                  {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex cursor-pointer items-center gap-2",
                            pathname.startsWith(item.href) && "font-semibold",
                          )}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        <button
          type="button"
          onClick={toggle}
          aria-label={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

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
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold leading-tight">
                {displayName || "Account"}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {email}
              </p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to="/app/profile" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span>Profile settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/app/upgrade" className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <span>Upgrade plan</span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${TIER_BADGE[tier]}`}
                >
                  {TIER_LABELS[tier]}
                </span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
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
