import { Link } from "react-router-dom";
import { ArrowRight, Settings2, Sparkles, Target, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DashboardStartHereCard({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">
                Start here
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                Turn your first goal into an actual plan
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                You finished onboarding. Now give yourself one clear win:
                create your first goal, break it into steps, and trim your
                dashboard down to only the modules you care about.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  1. Generate a goal
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Let AI turn one big goal into small, realistic next steps.
                </p>
              </div>

              <div className="rounded-xl border bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4 text-primary" />
                  2. Pick one first action
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Start with something tiny so the app feels useful right away.
                </p>
              </div>

              <div className="rounded-xl border bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Settings2 className="h-4 w-4 text-primary" />
                  3. Customize modules
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Hide sections you do not need so your dashboard stays calm.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <Link to="/app/goals" state={{ openGoalModal: "ai" }}>
                  <Sparkles className="h-4 w-4" />
                  Generate first goal
                </Link>
              </Button>

              <Button asChild variant="outline" className="gap-2">
                <Link to="/app/goals" state={{ openGoalModal: "new" }}>
                  Create manually
                </Link>
              </Button>

              <Button asChild variant="ghost" className="gap-2">
                <Link to="/app/profile">
                  Choose modules
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="shrink-0"
            aria-label="Dismiss start here card"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}