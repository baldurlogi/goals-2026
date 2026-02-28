import { Link } from "react-router-dom";
import { CalendarDays, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScheduleDashboard } from "../hooks/useScheduleDashboard";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

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
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
        isNext && !done ? "bg-primary/8 ring-1 ring-primary/20" : ""
      } ${done ? "opacity-50" : ""}`}
    >
      <span className="w-11 shrink-0 text-xs tabular-nums text-muted-foreground">
        {time}
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

function ScheduleCardSkeleton() {
  return (
    <Card className="relative overflow-hidden lg:col-span-7">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Today&apos;s schedule
            </span>
          </div>

          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="mt-3 space-y-1">
          <Skeleton className="h-1.5 w-full" />
          <div className="flex justify-end">
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-5">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />

        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ScheduleCard() {
  const {
    summary,
    nextBlock,
    nextBlockIndex,
    previewBlocks,
    completedSet,
    viewLabel,
    totalBlocks,
    isLoading, // <-- add this to your hook return
  } = useScheduleDashboard() as ReturnType<typeof useScheduleDashboard> & {
    isLoading?: boolean;
  };

  if (isLoading) return <ScheduleCardSkeleton />;

  return (
    <Card className="relative overflow-hidden lg:col-span-7">
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
              · {nextBlock.time}
            </span>
          </div>
        ) : (
          <div className="mt-2 text-sm font-semibold text-emerald-500">
            🎉 All blocks done for today!
          </div>
        )}

        <div className="mt-3 space-y-1">
          <Progress value={summary.pct} className="h-1.5" />
          <div className="text-right text-[10px] text-muted-foreground tabular-nums">
            {summary.pct}%
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-0.5 pb-5">
        {previewBlocks.map((item, i) => (
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
            <Link to="/daily-plan/schedule">
              Full schedule <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}