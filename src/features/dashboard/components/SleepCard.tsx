import { Link } from "react-router-dom";
import { ChevronRight, Moon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { SleepCardSkeleton } from "../skeletons";
import { useSleepDashboard } from "../hooks/useSleepDashboard";

function formatSleepDuration(totalMinutes: number | null): string {
  if (totalMinutes === null) return "Not logged";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function SleepCardInner() {
  const { latest, hasEntry, loggedToday, loading } = useSleepDashboard();

  if (loading && !latest) return <SleepCardSkeleton />;

  const entry = hasEntry && loggedToday ? latest : null;

  return (
    <Card className="relative overflow-hidden lg:col-span-6 min-h-[220px]">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sleep / Recovery
            </span>
          </div>
          <Badge variant={loggedToday ? "secondary" : "outline"}>
            {loggedToday ? "Logged today" : "Not logged today"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {!entry ? (
          <div className="rounded-lg bg-muted/40 px-3 py-4 text-center">
            <p className="text-sm font-medium">Not logged today</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Log last night&apos;s sleep to see today&apos;s recovery summary here.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight">
                {formatSleepDuration(entry.sleepDurationMinutes)}
              </p>
              <p className="text-sm text-muted-foreground">
                {entry.sleepQualityScore !== null
                  ? `Sleep quality ${entry.sleepQualityScore}/100`
                  : "No quality score added"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                <div className="text-sm font-bold">
                  {entry.bedtime ?? "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  Bedtime
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                <div className="text-sm font-bold">
                  {entry.wakeTime ?? "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  Wake time
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                <div className="text-sm font-bold">
                  {entry.energyLevel !== null ? `${entry.energyLevel}/5` : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  Energy
                </div>
              </div>
            </div>
          </>
        )}

        <Button asChild variant="ghost" className="w-full justify-between px-0 text-sm">
          <Link to="/app/sleep">
            Open Sleep / Recovery
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function SleepCard() {
  return (
    <ErrorBoundary
      variant="card"
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onRetry={reset}
          label="Sleep"
          colSpan="lg:col-span-6"
        />
      )}
    >
      <SleepCardInner />
    </ErrorBoundary>
  );
}
