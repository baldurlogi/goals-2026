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
            Start with one goal that actually matters to you
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Describe it in plain language and Begyn will turn it into a clear
            step-by-step plan, so you can stop overthinking and know what to do
            first.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          {["Get leaner by summer", "Read every day", "Save for a trip"].map((example) => (
            <span
              key={example}
              className="rounded-full border bg-muted/40 px-3 py-1.5"
            >
              {example}
            </span>
          ))}
        </div>

        <Button onClick={handleGenerate} size="lg" className="gap-2 px-8">
          <Sparkles className="h-4 w-4" />
          Build my first plan with AI
        </Button>

        <p className="text-xs text-muted-foreground/60">
          Takes about 30 seconds and gives you a clear next step
        </p>
      </CardContent>
    </Card>
  );
}
