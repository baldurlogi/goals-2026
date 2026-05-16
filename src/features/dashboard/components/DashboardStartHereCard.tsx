import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DashboardStartHereCard() {
  const navigate = useNavigate();

  function handleGenerate() {
    navigate("/app/goals/ai");
  }

  return (
    <Card className="ai-layer relative overflow-hidden border-0 bg-transparent shadow-none">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-400" />

      <CardContent className="space-y-4 px-4 py-5">
        <div className="flex items-start gap-3">
          <div className="ai-layer-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight">
              Give your AI coach one real direction
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Describe one goal and Begyn will turn it into a first move you can act on today.
            </p>
          </div>
        </div>

        <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 text-xs text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["Get leaner by summer", "Read every day", "Save for a trip"].map((example) => (
            <span
              key={example}
              className="ai-layer-soft max-w-[72vw] shrink-0 truncate rounded-full px-3 py-1.5"
            >
              {example}
            </span>
          ))}
        </div>

        <Button onClick={handleGenerate} size="sm" className="w-full gap-2 rounded-full">
          <Sparkles className="h-4 w-4" />
          Build first plan with AI
        </Button>

        <p className="text-center text-xs text-muted-foreground/60">
          One minute now makes the home screen feel alive.
        </p>
      </CardContent>
    </Card>
  );
}
