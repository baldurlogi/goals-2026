import { Link } from "react-router-dom";
import {
  Sparkles,
  Trophy,
  Target,
  ChevronRight,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import { AIUsageLimitNotice } from "@/features/subscription/AIUsageLimitNotice";
import { UpgradeBanner } from "@/features/subscription/UpgradeBanner";
import { useWeeklyReport, isSunday } from "../hooks/useWeeklyReport";
import { formatDateWithPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";

export function WeeklyReportCard() {
  const preferences = useUserPreferences();
  const { modules } = useEnabledModules();
  const {
    report,
    status,
    error,
    limitHit,
    generate,
    weekStart,
    weekEnd,
    isThisWeek,
  } = useWeeklyReport(modules);


  const isGenerating = status === "generating";
  const isLoading = status === "loading";
  const showLoadingState = isLoading && !report;

  const weekLabel = (() => {
    const start = new Date(weekStart + "T00:00:00");
    const end = new Date(weekEnd + "T00:00:00");

    const startDay = formatDateWithPreferences(start, preferences, { day: "numeric" });
    const startMonth = formatDateWithPreferences(start, preferences, { month: "short" });
    const endDay = formatDateWithPreferences(end, preferences, { day: "numeric" });
    const endMonth = formatDateWithPreferences(end, preferences, { month: "short" });

    if (startMonth === endMonth) {
      return `${startDay}–${endDay} ${endMonth}`;
    }

    return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
  })();

  const todayIsSunday = isSunday();
  const hasThisWeekReport = Boolean(report && isThisWeek);

  const showUpgradeLock =
    !limitHit &&
    !!error &&
    error.toLowerCase().includes("upgrade to pro");

  const showGenericError =
    !limitHit &&
    !showUpgradeLock &&
    !!error;

  return (
    <div className="ai-layer min-h-[180px] space-y-3 rounded-2xl p-4 lg:col-span-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Weekly Report</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              {weekLabel}
              {hasThisWeekReport && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 text-emerald-400 font-medium">
                  ready
                </span>
              )}
              {todayIsSunday && !hasThisWeekReport && (
                <span className="rounded-full bg-violet-500/15 px-1.5 text-violet-400 font-medium">
                  today
                </span>
              )}
            </p>
          </div>
        </div>

        {hasThisWeekReport && report && (
          <div className="ai-layer-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <span className="text-lg font-bold text-violet-300">
              {report.report.overallScore}
            </span>
          </div>
        )}
      </div>

      {showLoadingState && (
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded bg-muted/40 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted/40 animate-pulse" />
        </div>
      )}

      {!showLoadingState && !hasThisWeekReport && (
        <div className="space-y-3">
          <div className="ai-layer-soft rounded-2xl px-3 py-2">
            <p className="text-sm font-semibold leading-tight">
              {todayIsSunday ? "Turn this week into signal" : "Your weekly pattern is waiting"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-5">
            {todayIsSunday
              ? "Generate a focused review while the week is still fresh."
              : "Create a short AI read on wins, drift, and next week's first move."}
            </p>
          </div>

          {limitHit ? (
            <AIUsageLimitNotice
              feature="AI weekly report"
              message={error ?? undefined}
            />
          ) : showUpgradeLock ? (
            <UpgradeBanner
              feature="AI Weekly Life Report"
              requiredTier="pro"
            />
          ) : showGenericError ? (
            <div className="rounded-xl bg-destructive/5 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.14)]">
              <p className="text-sm font-medium text-foreground">
                Couldn't generate your weekly report
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {error}
              </p>
              <Button
                onClick={generate}
                disabled={isGenerating}
                size="sm"
                variant="outline"
                className="mt-3 gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Try again
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={generate}
              disabled={isGenerating}
              size="sm"
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {todayIsSunday ? "Generate Sunday read" : "Generate pattern read"}
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {!showLoadingState && hasThisWeekReport && report && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {report.report.headline}
          </p>

          {report.report.wins?.[0] && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-500/8 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.12)]">
              <Trophy className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
              <p className="text-xs text-emerald-300 leading-relaxed">
                {report.report.wins[0].title}
              </p>
            </div>
          )}

          {report.report.nextWeekFocus?.[0] && (
            <div className="flex items-start gap-2 rounded-lg bg-primary/8 px-3 py-2 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.10)]">
              <Target className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
              <p className="text-xs text-primary/80 leading-relaxed">
                {report.report.nextWeekFocus[0].action}
              </p>
            </div>
          )}

          <Link
            to="/app/weekly-report"
            className="ai-layer-soft flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/30"
          >
            <span>View full report</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      )}
    </div>
  );
}
