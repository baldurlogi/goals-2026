import { Link } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { useSkincareDashboard } from "../hooks/useSkincareDashboard";
import { FitnessCardSkeleton } from "@/features/dashboard/skeletons";

function SkincareCardInner() {
  const { summary, loading } = useSkincareDashboard();
  const cacheEmpty = summary.streakDays === 0 && summary.completedToday === 0;

  if (loading && cacheEmpty) return <FitnessCardSkeleton />;

  return (
    <Card className="relative overflow-hidden lg:col-span-4">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-fuchsia-500 via-pink-400 to-rose-400" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Skincare
            </span>
          </div>
          <Badge variant={summary.didCompleteToday ? "default" : "secondary"}>
            {summary.didCompleteToday ? "done today" : "in progress"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
            <div className="text-base font-bold tabular-nums text-fuchsia-500">
              {summary.streakDays}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              streak days
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
            <div className="text-base font-bold tabular-nums">
              {summary.completedToday}/8
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              done today
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
            <div className="text-base font-bold tabular-nums">
              {Number(summary.amDone) + Number(summary.pmDone)}/2
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              routines
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 px-3 py-3">
          <p className="text-sm font-medium">
            {summary.didCompleteToday
              ? "Your routine is already complete today."
              : "AM/PM routine is still waiting for today."}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Keep the streak alive by checking off today’s routine and logging any notes.
          </p>
        </div>

        <Button asChild variant="ghost" className="w-full justify-between px-0 text-sm">
          <Link to="/app/skincare">
            Open Skincare
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function SkincareCard() {
  return (
    <ErrorBoundary
      variant="card"
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onRetry={reset}
          label="Skincare"
          colSpan="lg:col-span-4"
        />
      )}
    >
      <SkincareCardInner />
    </ErrorBoundary>
  );
}
