import { useMemo } from "react";
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
  CalendarDays,
  ChevronDown,
  Ellipsis,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/authContext";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import {
  ALL_MODULES,
  ALWAYS_NAV_ITEMS,
  type ModuleDef,
} from "@/features/modules/modules";

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
  const { modules } = useEnabledModules();

  const sections: NavSection[] = useMemo(() => {
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

    const moduleItems = [...dailyItems, ...otherItems];

    return [
      ...(goalsItems.length > 0 ? [{ label: "Goals", items: goalsItems }] : []),
      ...(moduleItems.length > 0
        ? [{ label: "Modules", items: moduleItems }]
        : []),
    ];
  }, [modules]);

  const currentItem = useMemo(
    () =>
      sections
        .flatMap((s) => s.items)
        .find((i) => pathname.startsWith(i.href)),
    [sections, pathname],
  );

  const initials = getInitials(user);
  const displayName = getDisplayName(user);
  const email = user?.email ?? "";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const CurrentIcon = currentItem?.icon;

  const mobilePrimaryItems = useMemo(() => {
    const todayItem = modules.has("schedule")
      ? {
          label: "Today",
          href: "/app/schedule",
          icon: CalendarDays,
        }
      : {
          label: "Today",
          href: "/app/upcoming",
          icon: CalendarDays,
        };

    return [
      {
        label: "Home",
        href: "/app",
        icon: LayoutDashboard,
      },
      {
        label: "Goals",
        href: "/app/goals",
        icon: Target,
      },
      todayItem,
      {
        label: "Progress",
        href: "/app/progress",
        icon: TrendingUp,
      },
    ];
  }, [modules]);

  const overflowMobileItems = useMemo(() => {
    const primaryHrefs = new Set(mobilePrimaryItems.map((item) => item.href));
    return sections
      .flatMap((section) => section.items)
      .filter((item) => !primaryHrefs.has(item.href));
  }, [mobilePrimaryItems, sections]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 md:backdrop-blur supports-[backdrop-filter]:md:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-10">
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
              className="flex min-w-0 items-center gap-1.5 px-2 text-sm font-medium"
            >
              {currentItem && CurrentIcon ? (
                <>
                  <CurrentIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{currentItem.label}</span>
                </>
              ) : (
                "Navigate"
              )}
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
                  loading="lazy"
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
                <span>Pricing preview</span>
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

      <nav className="fixed inset-x-0 bottom-3 z-40 px-4 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="ai-reactive-edge mx-auto flex max-w-[min(31rem,calc(100vw-2rem))] items-center justify-between gap-1 rounded-full border border-white/10 bg-background/58 px-1.5 py-1.5 shadow-[0_18px_58px_rgba(2,6,23,0.28)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/42">
          {mobilePrimaryItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[9.5px] font-semibold leading-none transition-all duration-300 ease-out active:scale-95",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:-translate-y-0.5 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-x-2 top-1 h-8 rounded-full opacity-0 blur-md transition-all duration-500",
                    isActive && "bg-primary/22 opacity-100",
                  )}
                />
                <span
                  className={cn(
                    "relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300",
                    isActive
                      ? "bg-background/70 shadow-[0_8px_24px_rgba(74,222,128,0.20)]"
                      : "group-hover:bg-background/45",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      isActive
                        ? "-translate-y-0.5 scale-105 text-primary"
                        : "group-hover:-translate-y-0.5",
                    )}
                  />
                </span>
                <span className="relative max-w-full truncate">{item.label}</span>
                <span
                  className={cn(
                    "relative mt-0.5 h-1 w-1 rounded-full bg-primary opacity-0 transition-all duration-300",
                    isActive && "opacity-100 shadow-[0_0_14px_rgba(74,222,128,0.7)]",
                  )}
                />
              </Link>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "group relative flex h-auto min-w-0 flex-1 flex-col gap-0.5 rounded-full px-1 py-1.5 text-[9.5px] font-semibold leading-none transition-all duration-300 ease-out active:scale-95",
                  overflowMobileItems.some((item) => pathname.startsWith(item.href))
                    ? "text-foreground hover:text-foreground"
                    : "text-muted-foreground hover:-translate-y-0.5 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-x-2 top-1 h-8 rounded-full opacity-0 blur-md transition-all duration-500",
                    overflowMobileItems.some((item) => pathname.startsWith(item.href)) &&
                      "bg-primary/22 opacity-100",
                  )}
                />
                <span
                  className={cn(
                    "relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300",
                    overflowMobileItems.some((item) => pathname.startsWith(item.href))
                      ? "bg-background/70 shadow-[0_8px_24px_rgba(74,222,128,0.20)]"
                      : "group-hover:bg-background/45",
                  )}
                >
                  <Ellipsis
                    className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      overflowMobileItems.some((item) => pathname.startsWith(item.href))
                        ? "-translate-y-0.5 scale-105 text-primary"
                        : "group-hover:-translate-y-0.5",
                    )}
                  />
                </span>
                <span className="relative text-[9.5px]">More</span>
                <span
                  className={cn(
                    "relative mt-0.5 h-1 w-1 rounded-full bg-primary opacity-0 transition-all duration-300",
                    overflowMobileItems.some((item) => pathname.startsWith(item.href)) &&
                      "opacity-100 shadow-[0_0_14px_rgba(74,222,128,0.7)]",
                  )}
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="mb-3 w-56 rounded-2xl bg-background/90 backdrop-blur-xl">
              {overflowMobileItems.length === 0 ? (
                <DropdownMenuItem asChild>
                  <Link to="/app/profile">Configure modules</Link>
                </DropdownMenuItem>
              ) : (
                overflowMobileItems.map((item) => {
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
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}
