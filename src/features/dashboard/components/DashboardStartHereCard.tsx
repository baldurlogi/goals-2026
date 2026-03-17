import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DashboardStartHereCard() {
  const navigate = useNavigate();

  function handleGenerate() {
    navigate("/app/goals", { state: { openGoalModal: "ai" } });
  }

  return (
    <Card className="relative overflow-hidden border-primary/20">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-400" />

      <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center sm:py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            What's one big thing you want to achieve?
          </h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Type it in plain language — AI will turn it into a clear,
            step-by-step plan in seconds.
          </p>
        </div>

        <Button onClick={handleGenerate} size="lg" className="gap-2 px-8">
          <Sparkles className="h-4 w-4" />
          Create my first goal
        </Button>

        <p className="text-xs text-muted-foreground/60">
          Takes about 30 seconds
        </p>
      </CardContent>
    </Card>
  );
}
