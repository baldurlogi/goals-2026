import { Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useReadingDashboard } from "../hooks/useReadingDashboard";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

function Stat({ label, value, color = "text-foreground" }: {
  label: string; value: string; color?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
      <div className={`text-base font-bold tabular-nums ${color}`}>{value}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ReadingCardSkeleton() {
  return (
    <Card className="relative overflow-hidden lg:col-span-5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Reading now
          </span>
        </div>
        <Skeleton className="mt-2 h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ReadingCard() {
  const { stats, hasReading, loading } = useReadingDashboard();

  // Only show skeleton if loading AND cache was empty (no data to show yet)
  const cacheEmpty = !stats.current.title && !stats.current.author;
  if (loading && cacheEmpty) return <ReadingCardSkeleton />;

  return (
    <Card className="group relative overflow-hidden lg:col-span-5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Reading now
          </span>
        </div>

        {hasReading ? (
          <>
            <p className="mt-2 text-base font-bold leading-tight">
              {stats.current.title || "Untitled"}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.current.author || "Unknown author"}
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-base font-bold">No book set</p>
            <p className="text-xs text-muted-foreground">
              Add your current book to track progress.
            </p>
          </>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-5">
        {hasReading ? (
          <>
            <Progress value={stats.pct} className="h-2.5 rounded-full" />

            <div className="grid grid-cols-3 gap-2">
              <Stat label="Progress"   value={`${stats.pct}%`}                    color="text-emerald-500" />
              <Stat label="Pages left" value={String(stats.pagesLeft)}            />
              <Stat label="Est. finish" value={`${stats.daysToFinishCurrent}d`}   color="text-teal-500" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Daily goal:{" "}
                <span className="font-semibold text-foreground">
                  {stats.dailyGoalPages} pages
                </span>
              </p>
              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Link to="/reading">
                  Open <ChevronRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <Button asChild size="sm" className="w-full">
            <Link to="/reading">Set up reading</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}