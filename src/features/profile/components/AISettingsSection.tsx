import { memo } from "react";
import { Brain, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ALL_MODULES } from "@/features/modules/modules";
import type { PreferredTone } from "@/features/ai/aiUserProfile";

type Props = {
  aiSaving: boolean;
  aiAboutMe: string;
  aiTone: PreferredTone;
  aiGoalsSummary: string;
  aiLifestyleNotes: string;
  aiFocusAreas: string[];
  onAiAboutMeChange: (value: string) => void;
  onAiToneChange: (value: PreferredTone) => void;
  onAiGoalsSummaryChange: (value: string) => void;
  onAiLifestyleNotesChange: (value: string) => void;
  onAiFocusAreasChange: (value: string[]) => void;
  onSave: () => void;
};

export const AISettingsSection = memo(function AISettingsSection({
  aiSaving,
  aiAboutMe,
  aiTone,
  aiGoalsSummary,
  aiLifestyleNotes,
  aiFocusAreas,
  onAiAboutMeChange,
  onAiToneChange,
  onAiGoalsSummaryChange,
  onAiLifestyleNotesChange,
  onAiFocusAreasChange,
  onSave,
}: Props) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-base">AI Coach Settings</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Help your AI coach understand you better</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">About you</label>
          <p className="text-xs text-muted-foreground">
            Write a few sentences about yourself — your situation, what drives you, what you struggle with.
          </p>
          <textarea
            value={aiAboutMe}
            onChange={(e) => onAiAboutMeChange(e.target.value)}
            rows={4}
            maxLength={600}
            className={cn(
              "w-full resize-none rounded-xl border bg-muted/30 px-3 py-2.5 text-sm",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50",
            )}
          />
          <p className="text-right text-[10px] text-muted-foreground">{aiAboutMe.length}/600</p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">Coaching tone</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              { value: "encouraging", label: "Encouraging", emoji: "🌱", desc: "Warm & positive" },
              { value: "direct", label: "Direct", emoji: "⚡", desc: "No-nonsense" },
              { value: "analytical", label: "Analytical", emoji: "📊", desc: "Data-driven" },
              { value: "tough_love", label: "Tough Love", emoji: "🔥", desc: "High standards" },
            ] as { value: PreferredTone; label: string; emoji: string; desc: string }[]).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => onAiToneChange(t.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                  aiTone === t.value
                    ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-violet-500/30 hover:text-foreground",
                )}
              >
                <span className="text-lg">{t.emoji}</span>
                <span className="text-xs font-semibold">{t.label}</span>
                <span className="text-[10px] opacity-70">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium">What are you optimising for?</label>
          <textarea
            value={aiGoalsSummary}
            onChange={(e) => onAiGoalsSummaryChange(e.target.value)}
            rows={3}
            maxLength={400}
            className={cn(
              "w-full resize-none rounded-xl border bg-muted/30 px-3 py-2.5 text-sm",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50",
            )}
          />
          <p className="text-right text-[10px] text-muted-foreground">{aiGoalsSummary.length}/400</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium">Lifestyle context</label>
          <textarea
            value={aiLifestyleNotes}
            onChange={(e) => onAiLifestyleNotesChange(e.target.value)}
            rows={3}
            maxLength={400}
            className={cn(
              "w-full resize-none rounded-xl border bg-muted/30 px-3 py-2.5 text-sm",
              "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50",
            )}
          />
          <p className="text-right text-[10px] text-muted-foreground">{aiLifestyleNotes.length}/400</p>
        </div>

        <Separator />

        <div className="space-y-3">
          <label className="text-sm font-medium">Focus areas</label>
          <div className="flex flex-wrap gap-2">
            {ALL_MODULES.map((m) => {
              const active = aiFocusAreas.includes(m.id);
              const Icon = m.icon;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    onAiFocusAreasChange(active ? aiFocusAreas.filter((x) => x !== m.id) : [...aiFocusAreas, m.id])
                  }
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-violet-500/30 hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onSave} disabled={aiSaving} className="min-w-[140px] gap-2">
            {aiSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {aiSaving ? "Saving…" : "Save AI settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
