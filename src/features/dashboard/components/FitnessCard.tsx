import { Link } from 'react-router-dom';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtValue } from '@/features/fitness/fitnessStorage';
import { useFitnessDashboard } from '../hooks/useFitnessDashboard';
import { FitnessCardSkeleton } from '@/features/dashboard/skeletons';
import { ErrorBoundary, CardErrorFallback } from '@/components/ErrorBoundary';
import { DashboardEmptyState } from './DashboardEmptyState';

function MiniBar({
  pct,
  color = 'bg-violet-500',
}: {
  pct: number;
  color?: string;
}) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function FitnessCardInner() {
  const { topLifts, loading } = useFitnessDashboard();

  const cacheEmpty = topLifts.every((l) => l.best === null);
  if (loading && cacheEmpty) return <FitnessCardSkeleton />;

  const anyData = topLifts.some((l) => l.best !== null);

  return (
    <Card className="ai-layer relative overflow-hidden border-0 bg-transparent shadow-none lg:col-span-4">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              PRs & Fitness
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {!anyData ? (
          <DashboardEmptyState
            icon={<Dumbbell className="h-4 w-4 text-violet-500" />}
            title="Set one strength baseline"
            message="One lift or skill gives your coach a recovery-aware progress signal."
            actionLabel="Add PR"
            href="/app/fitness"
            hint="Start with the movement you care about most."
          />
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Lifts
            </p>

            {topLifts.map((lift) => (
              <div key={lift.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{lift.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {lift.best !== null ? (
                      <>
                        <span className="font-semibold text-foreground">
                          {fmtValue(lift.best, lift.unit)}
                        </span>{" "}
                        / {fmtValue(lift.goal, lift.unit)}
                      </>
                    ) : (
                      <span className="italic">— / {fmtValue(lift.goal, lift.unit)}</span>
                    )}
                  </span>
                </div>

                <MiniBar pct={lift.pct} color="bg-violet-500" />
              </div>
            ))}
          </div>
        )}

        <Button asChild variant="ghost" className="w-full justify-between px-0 text-sm">
          <Link to="/app/fitness">
            Open Fitness
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function FitnessCard() {
  return (
    <ErrorBoundary
      variant="card"
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onRetry={reset}
          label="Fitness"
          colSpan="lg:col-span-4"
        />
      )}
    >
      <FitnessCardInner />
    </ErrorBoundary>
  );
}
