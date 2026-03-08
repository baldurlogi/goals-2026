/**
 * WeeklyReportCard.tsx
 *
 * Dashboard bento card for the AI Weekly Report.
 * - Pro+ only — hidden for free tier
 * - Shows latest report summary if available
 * - Shows "Generate" CTA on Sundays when no report exists for this week
 * - Shows "View report" link otherwise
 *
 * Place in DashboardPage grid: lg:col-span-6
 */

import { Link } from "react-router-dom";
import {
  Sparkles, Trophy, Target, ChevronRight,
  RefreshCw, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import { useWeeklyReport, isSunday } from "../hooks/useWeeklyReport";

export function WeeklyReportCard() {
  const { modules } = useEnabledModules();
  const { report, status, generate, weekStart, isThisWeek } = useWeeklyReport(modules);

  const isGenerating = status === "generating";
  const isLoading = status === "loading";

  const weekLabel = (() => {
    const d = new Date(weekStart + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  })();

  const todayIsSunday = isSunday();
  const hasThisWeekReport = report && isThisWeek;

  return (
    <div className="lg:col-span-6 rounded-2xl border bg-card p-5 space-y-4">
      {/* Header */}
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
        {hasThisWeekReport && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20">
            <span className="text-lg font-bold text-violet-300">
              {report!.report.overallScore}
            </span>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded bg-muted/40 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted/40 animate-pulse" />
        </div>
      )}

      {/* No report yet — Sunday CTA */}
      {!isLoading && !hasThisWeekReport && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {todayIsSunday
              ? "It's Sunday — your weekly review is ready to generate."
              : "No report for this week yet. Generate one any time."}
          </p>
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
                {todayIsSunday ? "Generate Sunday Report" : "Generate Report"}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Has report — show headline + top win + top focus */}
      {!isLoading && hasThisWeekReport && report && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {report.report.headline}
          </p>

          {/* Top win */}
          {report.report.wins?.[0] && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-3 py-2">
              <Trophy className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
              <p className="text-xs text-emerald-300 leading-relaxed">
                {report.report.wins[0].title}
              </p>
            </div>
          )}

          {/* Top focus */}
          {report.report.nextWeekFocus?.[0] && (
            <div className="flex items-start gap-2 rounded-lg bg-primary/8 border border-primary/15 px-3 py-2">
              <Target className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
              <p className="text-xs text-primary/80 leading-relaxed">
                {report.report.nextWeekFocus[0].action}
              </p>
            </div>
          )}

          <Link
            to="/app/weekly-report"
            className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted/30 transition-colors"
          >
            <span>View full report</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      )}
    </div>
  );
}