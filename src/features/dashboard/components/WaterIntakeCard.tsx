import { Link } from "react-router-dom";
import { useState } from "react";
import { ChevronRight, Droplets, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      variant="ghost"
      size="sm"
      className="h-8 rounded-full bg-background/24 px-3 text-xs font-semibold tabular-nums text-cyan-100 hover:bg-background/40"
      onClick={() => {
        void onClick(amount);
      }}
    >
      +{amount}ml
    </Button>
  );
}

function HydrationOrb({
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
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (fillPct / 100) * circumference;

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <div className="absolute inset-2 rounded-full bg-cyan-300/10 blur-xl" />
      <svg className="relative h-28 w-28 -rotate-90" viewBox="0 0 90 90" aria-hidden="true">
        <defs>
          <linearGradient id="hydration-orb-ring" x1="8" y1="8" x2="82" y2="82">
            <stop offset="0%" stopColor={goalHit ? "#34d399" : "#67e8f9"} />
            <stop offset="58%" stopColor={goalHit ? "#67e8f9" : "#38bdf8"} />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx="45" cy="45" r="36" fill="none" strokeWidth="6" className="stroke-white/10" />
        <circle
          cx="45"
          cy="45"
          r="36"
          fill="none"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="url(#hydration-orb-ring)"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tabular-nums">{currentMl}</span>
        <span className="text-[10px] text-muted-foreground">/{targetMl} ml</span>
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
    setTarget,
  } = useWaterDashboard();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [draftTarget, setDraftTarget] = useState("");

  function startEditingGoal() {
    setDraftTarget(String(log.targetMl));
    setIsEditingGoal(true);
  }

  async function submitGoal() {
    const nextTarget = Number(draftTarget.replace(",", "."));
    if (!Number.isFinite(nextTarget) || nextTarget <= 0) {
      setDraftTarget(String(log.targetMl));
      setIsEditingGoal(false);
      return;
    }

    await setTarget(nextTarget);
    setDraftTarget("");
    setIsEditingGoal(false);
  }

  function cancelGoalEdit() {
    setDraftTarget("");
    setIsEditingGoal(false);
  }

  return (
    <Card className="ai-layer relative overflow-hidden border-0 bg-transparent shadow-none lg:col-span-4">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

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
          <HydrationOrb
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

            <div className="rounded-2xl bg-background/18 p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Daily goal
                </span>
                {!isEditingGoal ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={startEditingGoal}
                  >
                    Edit
                  </Button>
                ) : null}
              </div>

              {!isEditingGoal ? (
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {log.targetMl} ml
                </p>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    inputMode="numeric"
                    value={draftTarget}
                    onChange={(event) => setDraftTarget(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void submitGoal();
                      }
                      if (event.key === "Escape") {
                        cancelGoalEdit();
                      }
                    }}
                    className="h-8 text-sm"
                    aria-label="Daily water target in milliliters"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      void submitGoal();
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={cancelGoalEdit}
                  >
                    Cancel
                  </Button>
                </div>
              )}
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
