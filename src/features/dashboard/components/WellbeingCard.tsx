import { Link } from "react-router-dom";
import { ChevronRight, Heart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { WellbeingCardSkeleton } from "../skeletons";
import { useWellbeingDashboard } from "../hooks/useWellbeingDashboard";

const MOOD_LABELS: Record<number, string> = {
  1: "Rough",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great",
};

const SCALE_LABELS: Record<number, string> = {
  1: "Very low",
  2: "Low",
  3: "Steady",
  4: "Good",
  5: "High",
};

function WellbeingCardInner() {
  const { latest, hasEntry, checkedInToday, loading } = useWellbeingDashboard();

  if (loading && !latest) return <WellbeingCardSkeleton />;

  const entry = hasEntry && checkedInToday ? latest : null;

  return (
    <Card className="relative overflow-hidden lg:col-span-6 min-h-[220px]">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-pink-500 via-rose-400 to-orange-300" />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 text-pink-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Mental Wellbeing
            </span>
          </div>
          <Badge variant={checkedInToday ? "secondary" : "outline"}>
            {checkedInToday ? "Checked in today" : "Not logged today"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {!entry ? (
          <div className="rounded-lg bg-muted/40 px-3 py-4 text-center">
            <p className="text-sm font-medium">Not logged today</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add today&apos;s mood check-in or journal entry to see it here.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight">
                {entry.moodScore !== null
                  ? `${entry.moodScore}/5 ${MOOD_LABELS[entry.moodScore]}`
                  : "Mood not logged"}
              </p>
              <p className="text-sm text-muted-foreground">
                {entry.journalEntry
                  ? "Reflection added"
                  : entry.gratitudeEntry
                    ? "Gratitude added"
                    : "No notes added"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                <div className="text-sm font-bold">
                  {entry.stressLevel !== null
                    ? `${entry.stressLevel}/5`
                    : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {entry.stressLevel !== null
                    ? SCALE_LABELS[entry.stressLevel]
                    : "Stress"}
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                <div className="text-sm font-bold">
                  {entry.energyLevel !== null
                    ? `${entry.energyLevel}/5`
                    : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {entry.energyLevel !== null
                    ? SCALE_LABELS[entry.energyLevel]
                    : "Energy"}
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                <div className="text-sm font-bold">
                  {entry.gratitudeEntry ? "Yes" : "No"}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  Gratitude
                </div>
              </div>
            </div>
          </>
        )}

        <Button asChild variant="ghost" className="w-full justify-between px-0 text-sm">
          <Link to="/app/wellbeing">
            Open Mental Wellbeing
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function WellbeingCard() {
  return (
    <ErrorBoundary
      variant="card"
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onRetry={reset}
          label="Wellbeing"
          colSpan="lg:col-span-6"
        />
      )}
    >
      <WellbeingCardInner />
    </ErrorBoundary>
  );
}
