import { Link } from "react-router-dom";
import { CalendarDays, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleCardSkeleton } from "@/features/dashboard/skeletons";
import { useScheduleDashboard } from "../hooks/useScheduleDashboard";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { formatTimeStringWithPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";

type ScheduleBlock = {
  time: string;
  icon: string;
  label: string;
};

function ScheduleRow({
  time,
  label,
  isNext,
  done,
}: {
  time: string;
  label: string;
  isNext?: boolean;
  done?: boolean;
}) {
  const preferences = useUserPreferences();
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
        isNext && !done ? "bg-primary/8 ring-1 ring-primary/20" : ""
      } ${done ? "opacity-50" : ""}`}
    >
      <span className="w-11 shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatTimeStringWithPreferences(time, preferences)}
      </span>
      <span
        className={`flex-1 text-sm ${
          isNext && !done ? "font-semibold" : "font-medium"
        } ${done ? "line-through text-muted-foreground" : ""}`}
      >
        {label}
      </span>
      {isNext && !done && (
        <Badge className="h-4 shrink-0 bg-primary/15 px-1.5 text-[10px] text-primary hover:bg-primary/15">
          next
        </Badge>
      )}
      {done && <span className="text-[10px] text-emerald-500">✓</span>}
    </div>
  );
}

function ScheduleCardInner() {
  const preferences = useUserPreferences();
  const {
    summary,
    nextBlock,
    nextBlockIndex,
    previewBlocks,
    completedSet,
    viewLabel,
    totalBlocks,
    loading,
  } = useScheduleDashboard();

  const cacheEmpty =
    previewBlocks.length === 0 &&
    totalBlocks === 0 &&
    !nextBlock &&
    summary.total === 0 &&
    summary.done === 0;

  if (loading && cacheEmpty) return <ScheduleCardSkeleton />;

  return (
    <Card className="ai-layer relative min-h-[320px] overflow-hidden border-0 bg-transparent shadow-none lg:col-span-7">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Today&apos;s schedule
            </span>
          </div>
          <Badge variant="secondary" className="tabular-nums text-[10px]">
            {summary.done}/{summary.total} done
          </Badge>
        </div>

        {nextBlock ? (
          <div className="mt-2 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Next:{" "}
              <span className="font-bold text-foreground">
                {nextBlock.icon} {nextBlock.label}
              </span>{" "}
              · {formatTimeStringWithPreferences(nextBlock.time, preferences)}
            </span>
          </div>
        ) : (
          <div className="mt-2 text-sm font-semibold text-emerald-500">
            🎉 All blocks done for today!
          </div>
        )}

        <div className="mt-3 space-y-1">
          <Progress value={summary.pct} className="h-1.5" />
          <div className="text-right text-[10px] tabular-nums text-muted-foreground">
            {summary.pct}%
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-0.5 pb-5">
        {previewBlocks.map((item: ScheduleBlock, i: number) => (
          <ScheduleRow
            key={`${item.time}-${i}`}
            time={item.time}
            label={`${item.icon} ${item.label}`}
            isNext={i === nextBlockIndex}
            done={completedSet.has(i)}
          />
        ))}

        {totalBlocks > 5 && (
          <p className="pl-2 pt-1 text-[11px] text-muted-foreground">
            +{totalBlocks - 5} more blocks on Schedule tab
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-muted-foreground">{viewLabel}</span>
          <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Link to="/app/schedule">
              Full schedule <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScheduleCard() {
  return (
    <ErrorBoundary
      variant="card"
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onRetry={reset}
          label="Schedule"
          colSpan="lg:col-span-7"
        />
      )}
    >
      <ScheduleCardInner />
    </ErrorBoundary>
  );
}
