import { Link } from "react-router-dom";
import { ChevronRight, Dumbbell } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFitnessDashboard } from "../hooks/useFitnessDashboard";

function MiniBar({ pct, color = "bg-violet-500" }: { pct: number; color?: string }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function FitnessCard() {
  const { topLifts } = useFitnessDashboard();

  const anyData = topLifts.some((l) => l.best !== null);

  return (
    <Card className="relative overflow-hidden lg:col-span-4">
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
          <div className="rounded-lg bg-muted/40 px-3 py-4 text-center">
            <p className="text-sm font-medium">No PRs logged yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Head to Fitness to log your first PR.
            </p>
          </div>
        ) : (
          <>
            {/* Lifts */}
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
                        <><span className="font-semibold text-foreground">{lift.best}kg</span> / {lift.goal}kg</>
                      ) : (
                        <span className="italic">— / {lift.goal}kg</span>
                      )}
                    </span>
                  </div>
                  <MiniBar pct={lift.pct} color="bg-violet-500" />
                </div>
              ))}
            </div>
            </>
        )}

        <div className="flex justify-end pt-1">
          <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Link to="/fitness">
              All PRs <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}