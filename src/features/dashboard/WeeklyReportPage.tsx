/**
 * WeeklyReportPage.tsx
 * Route: /app/weekly-report
 *
 * Full AI Weekly Life Report — Pro+ feature.
 * Shows the 5 sections: overall score, module scores, wins,
 * missed targets, patterns, and next-week focus.
 */

import { Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Trophy, AlertCircle,
  TrendingUp, Target, Brain, Calendar,
  RefreshCw, Lock, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTier, tierMeets } from "@/features/subscription/useTier";
import { useEnabledModules } from "@/features/modules/useEnabledModules";
import { useWeeklyReport, isSunday, type WeeklyReport } from "./hooks/useWeeklyReport";
import { formatDateWithPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#a78bfa" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg width="96" height="96" className="rotate-[-90deg]">
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor"
          strokeWidth="8" className="text-muted/30" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color}
          strokeWidth="8" strokeDasharray={circ}
          strokeDashoffset={circ - fill} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

function ModuleScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  );
}

const MODULE_COLORS: Record<string, string> = {
  goals:     "#f43f5e",
  fitness:   "#8b5cf6",
  nutrition: "#f97316",
  reading:   "#22c55e",
  todos:     "#3b82f6",
  schedule:  "#14b8a6",
};

function SectionHeader({ icon, title, count }: {
  icon: React.ReactNode; title: string; count?: number;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
        {icon}
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  );
}

// ── Report sections ───────────────────────────────────────────────────────────

function OverallScoreSection({ report }: { report: WeeklyReport }) {
  const scoreLabel = report.overallScore >= 80 ? "Exceptional week"
    : report.overallScore >= 65 ? "Solid week"
    : report.overallScore >= 50 ? "Mixed week"
    : "Tough week — keep going";

  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Overall
          </p>
          <h2 className="text-xl font-bold">{scoreLabel}</h2>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            {report.headline}
          </p>
        </div>
        <ScoreRing score={report.overallScore} />
      </div>
    </div>
  );
}

function ModuleScoresSection({ report }: { report: WeeklyReport }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <SectionHeader
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        title="Module scores"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {report.moduleScores.map(m => (
          <div key={m.module} className="space-y-2 rounded-xl border bg-background/50 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{m.emoji}</span>
                <span className="text-sm font-medium">{m.label}</span>
              </div>
              <span className="text-sm font-bold tabular-nums"
                style={{ color: MODULE_COLORS[m.module] ?? "#a78bfa" }}>
                {m.score}
              </span>
            </div>
            <ModuleScoreBar
              score={m.score}
              color={MODULE_COLORS[m.module] ?? "#a78bfa"}
            />
            <p className="text-xs text-muted-foreground leading-relaxed">{m.oneliner}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WinsSection({ report }: { report: WeeklyReport }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <SectionHeader
        icon={<Trophy className="h-4 w-4 text-amber-400" />}
        title="Wins"
        count={report.wins.length}
      />
      <div className="space-y-3">
        {report.wins.map((w, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
              <Trophy className="h-3 w-3" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-400">{w.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{w.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissedSection({ report }: { report: WeeklyReport }) {
  if (!report.missedTargets?.length) return null;
  return (
    <div className="rounded-2xl border bg-card p-6">
      <SectionHeader
        icon={<AlertCircle className="h-4 w-4 text-amber-400" />}
        title="Missed targets"
        count={report.missedTargets.length}
      />
      <div className="space-y-3">
        {report.missedTargets.map((m, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
              <AlertCircle className="h-3 w-3" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-400">{m.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{m.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatternsSection({ report }: { report: WeeklyReport }) {
  if (!report.patterns?.length) return null;
  return (
    <div className="rounded-2xl border bg-card p-6">
      <SectionHeader
        icon={<Brain className="h-4 w-4 text-violet-400" />}
        title="Patterns & insights"
        count={report.patterns.length}
      />
      <div className="space-y-3">
        {report.patterns.map((p, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
              <Brain className="h-3 w-3" />
            </div>
            <div>
              <p className="text-sm font-semibold text-violet-300">{p.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{p.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NextWeekSection({ report }: { report: WeeklyReport }) {
  const priorityColor = ["", "text-rose-400", "text-amber-400", "text-emerald-400"];
  const priorityBg = ["", "bg-rose-500/10", "bg-amber-500/10", "bg-emerald-500/10"];

  return (
    <div className="rounded-2xl border bg-card p-6">
      <SectionHeader
        icon={<Target className="h-4 w-4 text-primary" />}
        title="Next week focus"
      />
      <div className="space-y-3">
        {[...report.nextWeekFocus]
          .sort((a, b) => a.priority - b.priority)
          .map((f, i) => (
            <Link
              key={i}
              to={f.href}
              className="group flex items-start gap-3 rounded-xl border p-4 transition-all hover:bg-muted/30"
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold
                ${priorityBg[f.priority] ?? "bg-muted"} ${priorityColor[f.priority] ?? "text-muted-foreground"}`}>
                {f.priority}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{f.action}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{f.why}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 mt-0.5 group-hover:text-muted-foreground transition-colors" />
            </Link>
          ))}
      </div>
    </div>
  );
}

// ── Locked state ──────────────────────────────────────────────────────────────

function LockedState() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed p-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
        <Lock className="h-6 w-6 text-violet-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">AI Weekly Report is a Pro feature</h2>
        <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
          Every Sunday, get a personalised AI-generated analysis of your entire week —
          wins, gaps, patterns, and your 3 highest-impact priorities for next week.
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link to="/app/upgrade">
          <Sparkles className="h-4 w-4" /> Upgrade to Pro
        </Link>
      </Button>
    </div>
  );
}

// ── Empty / generate state ────────────────────────────────────────────────────

function GenerateState({
  onGenerate,
  generating,
  error,
  isToday,
}: {
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
  isToday: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed p-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
        <Sparkles className="h-6 w-6 text-violet-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          {isToday ? "Ready to generate your weekly report" : "No report yet for this week"}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
          {isToday
            ? "Your AI coach will review every module, surface your wins and gaps, and give you 3 focused priorities for next week."
            : "Weekly reports are best generated on Sundays, but you can generate one any time."}
        </p>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <Button
        onClick={onGenerate}
        disabled={generating}
        className="w-full gap-2 sm:w-auto sm:min-w-[180px]"
      >
        {generating ? (
          <>
            <div className="flex gap-1">
              {["bg-white/60", "bg-white/80", "bg-white"].map((c, i) => (
                <span key={i} className={`h-1.5 w-1.5 animate-bounce rounded-full ${c}`}
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate report
          </>
        )}
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function WeeklyReportPage() {
  const preferences = useUserPreferences();
  const tier = useTier();
  const isPro = tierMeets(tier, "pro");
  const { modules } = useEnabledModules();

  const {
    report,
    status,
    error,
    generate,
    weekStart,
    weekEnd,
    isThisWeek,
  } = useWeeklyReport(modules);

  const isGenerating = status === "generating";
  const isLoading = status === "loading";
  const hasThisWeekReport = Boolean(report && isThisWeek);

  const weekLabel = (() => {
    const start = new Date(weekStart + "T00:00:00");
    const end = new Date(weekEnd + "T00:00:00");

    const startDay = formatDateWithPreferences(start, preferences, { day: "numeric" });
    const startMonth = formatDateWithPreferences(start, preferences, { month: "long" });
    const endDay = formatDateWithPreferences(end, preferences, { day: "numeric" });
    const endMonth = formatDateWithPreferences(end, preferences, { month: "long" });
    const endYear = formatDateWithPreferences(end, preferences, { year: "numeric" });

    if (startMonth === endMonth) {
      return `${startDay}–${endDay} ${endMonth} ${endYear}`;
    }

    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
  })();

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      {/* Header */}
      <div className="space-y-3">
        <Link to="/app"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Week of {weekLabel}
                {isThisWeek && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    This week
                  </span>
                )}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Weekly Report</h1>
          </div>
          {hasThisWeekReport && isPro && (
            <Button
              variant="outline" size="sm"
              onClick={generate}
              disabled={isGenerating}
              className="gap-1.5 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Regenerating…" : "Regenerate"}
            </Button>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      {/* Locked */}
      {!isLoading && !isPro && <LockedState />}

      {/* Generate state */}
      {!isLoading && isPro && !hasThisWeekReport && (
        <GenerateState
          onGenerate={generate}
          generating={isGenerating}
          error={error}
          isToday={isSunday()}
        />
      )}

      {/* Report */}
      {!isLoading && isPro && hasThisWeekReport && report && (
        <div className="space-y-4">
          <OverallScoreSection report={report.report} />
          <ModuleScoresSection report={report.report} />
          <WinsSection report={report.report} />
          <MissedSection report={report.report} />
          <PatternsSection report={report.report} />
          <NextWeekSection report={report.report} />

          {/* Closing note */}
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 text-center">
            <p className="text-sm text-violet-300 italic leading-relaxed">
              "{report.report.closingNote}"
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              — Your AI coach, {formatDateWithPreferences(
                new Date(report.createdAt),
                preferences,
                { weekday: "long", day: "numeric", month: "long" },
              )}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
