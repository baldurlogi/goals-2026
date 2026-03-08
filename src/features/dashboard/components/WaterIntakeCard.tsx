import { Link } from "react-router-dom";
import { ChevronRight, Droplets, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { useWaterDashboard } from "@/hooks/useWaterDashboard";

function QuickAddButton({
  amount,
  onClick,
}: {
  amount: number;
  onClick: (amount: number) => void | Promise<void>;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 rounded-full px-3 text-xs font-semibold tabular-nums"
      onClick={() => {
        void onClick(amount);
      }}
    >
      +{amount}ml
    </Button>
  );
}

function WaterBottle({
  fillPct,
  currentMl,
  targetMl,
  goalHit,
}: {
  fillPct: number;
  currentMl: number;
  targetMl: number;
  goalHit: boolean;
}) {
  return (
    <div className="relative flex h-32 w-16 shrink-0 items-start justify-center">
      <div className="absolute top-0 h-3 w-6 rounded-t-xl border-x-2 border-t-2 border-cyan-300/40 bg-card" />
      <div className="absolute top-2 h-28 w-full overflow-hidden rounded-[1.4rem] border-2 border-cyan-300/30 bg-muted/40 p-1 shadow-inner">
        <div className="relative h-full w-full overflow-hidden rounded-[1.1rem] bg-background/40">
          <div
            className="absolute inset-x-0 bottom-0 transition-all duration-700 ease-out"
            style={{ height: `${fillPct}%` }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: goalHit
                  ? "linear-gradient(to top, rgba(34,197,94,0.95), rgba(45,212,191,0.85), rgba(103,232,249,0.8))"
                  : "linear-gradient(to top, rgba(14,165,233,0.95), rgba(34,211,238,0.9), rgba(125,211,252,0.8))",
              }}
            />
            <div className="absolute inset-x-0 top-0 h-3 bg-white/20 blur-sm" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center px-1 text-center">
            <div className="rounded-full bg-background/70 px-2 py-1 text-[10px] font-semibold tabular-nums shadow-sm">
              {currentMl}/{targetMl}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaterIntakeCardInner() {
  const {
    log,
    loading,
    progressPct,
    fillPct,
    remainingMl,
    glasses,
    goalHit,
    addQuick,
    resetToday,
  } = useWaterDashboard();

  return (
    <Card className="relative overflow-hidden lg:col-span-4">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Droplets className="h-3.5 w-3.5 text-cyan-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Water today
            </span>
          </div>

          <span className="text-[10px] text-muted-foreground">
            {loading
              ? "Syncing..."
              : goalHit
                ? "Goal hit ✨"
                : `${remainingMl}ml left`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex items-center gap-4">
          <WaterBottle
            fillPct={fillPct}
            currentMl={log.ml}
            targetMl={log.targetMl}
            goalHit={goalHit}
          />

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold leading-none tabular-nums">
                  {log.ml}
                </span>
                <span className="mb-0.5 text-sm text-muted-foreground">
                  / {log.targetMl} ml
                </span>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {goalHit
                  ? "Hydration target completed for today."
                  : `${progressPct}% complete • ${glasses} glasses`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <QuickAddButton amount={250} onClick={addQuick} />
              <QuickAddButton amount={500} onClick={addQuick} />
              <QuickAddButton amount={750} onClick={addQuick} />
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => {
                  void resetToday();
                }}
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>

              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Link to="/app/nutrition">
                  Nutrition <ChevronRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WaterIntakeCard() {
  return (
    <ErrorBoundary
      variant="card"
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onRetry={reset}
          label="Water"
          colSpan="lg:col-span-4"
        />
      )}
    >
      <WaterIntakeCardInner />
    </ErrorBoundary>
  );
}