import { useCallback, useEffect, useState } from "react";
import {
  X,
  Sparkles,
  Check,
  ChevronRight,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { getAISystemContext } from "@/features/ai/buildAIContext";
import type { UserGoal, UserGoalStep } from "@/features/goals/goalTypes";
import { AIUsageLimitNotice } from "@/features/subscription/AIUsageLimitNotice";
import { AIUsageInlineHint } from "@/features/subscription/AIUsageInlineHint";
import type { Tier } from "@/features/subscription/useTier";
import {
  markAIUsageLimitReached,
  writeAIUsageCache,
} from "@/features/subscription/aiUsageCache";
import { capture } from "@/lib/analytics";

const SUPABASE_FN =
  "https://jvtpemjrswfwsiwkhreq.supabase.co/functions/v1/hyper-responder";

type ImprovedStep = {
  id: string;
  label: string;
  notes: string;
  idealFinish: string | null;
  estimatedTime: string;
  links?: string[];
  isNew: boolean;
  isChanged: boolean;
};

type ImproveResult = {
  steps: ImprovedStep[];
  summary: string;
};

type ImproveLimitPayload = {
  error?: string;
  message?: string;
  tier?: Tier;
  monthly_limit?: number;
  prompts_used?: number;
};

type ImproveResponse = {
  improved?: ImproveResult;
  usage?: {
    tier?: Tier;
    monthly_limit?: number;
    prompts_used?: number;
    remaining?: number;
  };
};

class AIUsageLimitError extends Error {
  tier?: Tier;

  constructor(message: string, tier?: Tier) {
    super(message);
    this.name = "AIUsageLimitError";
    this.tier = tier;
  }
}

async function fetchImprovedSteps(
  goal: UserGoal,
  improveRequest: string,
): Promise<ImproveResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) throw new Error("Not signed in");

  let userContext = "";
  try {
    userContext = await getAISystemContext();
  } catch {
    // non-fatal
  }

  const res = await fetch(SUPABASE_FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      action: "improve",
      userContext,
      improveRequest,
      existingGoal: {
        title: goal.title,
        subtitle: goal.subtitle,
        emoji: goal.emoji,
        priority: goal.priority,
        steps: goal.steps.map((s) => ({
          id: s.id,
          label: s.label,
          notes: s.notes,
          idealFinish: s.idealFinish,
          estimatedTime: s.estimatedTime,
          links: s.links ?? [],
        })),
      },
    }),
  });

  if (res.status === 429) {
    const data = (await res.json().catch(() => ({}))) as ImproveLimitPayload;

    markAIUsageLimitReached({
      tier: data.tier,
      monthly_limit: data.monthly_limit,
      prompts_used: data.prompts_used,
    });

    throw new AIUsageLimitError(
      data.message ?? "Monthly AI limit reached. Upgrade for more AI improvements.",
      data.tier,
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to get suggestions");
  }

  const data = (await res.json()) as ImproveResponse;
  if (data.usage) {
    writeAIUsageCache(data.usage);
    capture("ai_prompt_used", {
      feature: "goal_improve",
      source: "improve_goal_modal",
      route: window.location.pathname,
      goal_id: goal.id,
      goal_title: goal.title,
      prompts_used: data.usage.prompts_used,
      monthly_limit: data.usage.monthly_limit,
      remaining: data.usage.remaining,
      tier: data.usage.tier,
    });
  }

  const improved = data.improved as ImproveResult;
  if (!improved?.steps?.length) throw new Error("No steps returned");
  return improved;
}

type StepStatus = "accepted" | "rejected";

function StepDiffRow({
  step,
  originalStep,
  status,
  onToggle,
}: {
  step: ImprovedStep;
  originalStep: UserGoalStep | null;
  status: StepStatus;
  onToggle: () => void;
}) {
  const isAccepted = status === "accepted";
  const tag = step.isNew ? "new" : step.isChanged ? "improved" : "unchanged";

  const tagColors = {
    new: "bg-emerald-500/15 text-emerald-500",
    improved: "bg-violet-500/15 text-violet-400",
    unchanged: "bg-muted text-muted-foreground",
  };

  return (
    <div
      className={`group relative cursor-pointer rounded-xl border p-4 transition-all ${
        isAccepted
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-muted/20 opacity-60"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            isAccepted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30"
          }`}
        >
          {isAccepted && <Check className="h-3 w-3" />}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium leading-snug ${
                !isAccepted ? "line-through text-muted-foreground" : ""
              }`}
            >
              {step.label}
            </span>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                tagColors[tag]
              }`}
            >
              {tag}
            </span>
          </div>

          {step.isChanged && originalStep && (
            <div className="text-[11px] text-muted-foreground/60 line-through">
              was: {originalStep.label}
            </div>
          )}

          {step.notes && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {step.notes}
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground/60">
            {step.idealFinish && <span>📅 {step.idealFinish}</span>}
            {step.estimatedTime && <span>⏱ {step.estimatedTime}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  goal: UserGoal;
  onApply: (newSteps: UserGoalStep[]) => void;
  onClose: () => void;
};

export function ImproveGoalModal({ goal, onApply, onClose }: Props) {
  const [phase, setPhase] = useState<
    "prompt" | "loading" | "review" | "error" | "limit"
  >("prompt");
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [limitTier, setLimitTier] = useState<Tier | null>(null);
  const [result, setResult] = useState<ImproveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Record<string, StepStatus>>({});
  const [improveRequest, setImproveRequest] = useState("");

  const originalById = Object.fromEntries(goal.steps.map((s) => [s.id, s]));

  const load = useCallback(async () => {
      try {
        const r = await fetchImprovedSteps(goal, improveRequest.trim());
        setResult(r);

        const defaults: Record<string, StepStatus> = {};
        r.steps.forEach((s) => {
          defaults[s.id] = "accepted";
        });

        setAccepted(defaults);
        setError(null);
        setLimitMessage(null);
        setLimitTier(null);
        setPhase("review");
      } catch (e) {
        if (e instanceof AIUsageLimitError) {
          setLimitMessage(e.message);
          setLimitTier(e.tier ?? null);
          setPhase("limit");
        } else {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setPhase("error");
        }
      }
    }, [goal, improveRequest]);

  const reload = useCallback(() => {
    setPhase("loading");
    setError(null);
    setResult(null);
    setAccepted({});
    setLimitMessage(null);
    setLimitTier(null);
    void load();
  }, [load]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function toggleStep(id: string) {
    setAccepted((prev) => ({
      ...prev,
      [id]: prev[id] === "accepted" ? "rejected" : "accepted",
    }));
  }

  function acceptAll() {
    const all: Record<string, StepStatus> = {};
    result?.steps.forEach((s) => {
      all[s.id] = "accepted";
    });
    setAccepted(all);
  }

  function rejectAll() {
    const all: Record<string, StepStatus> = {};
    result?.steps.forEach((s) => {
      all[s.id] = "rejected";
    });
    setAccepted(all);
  }

  function handleApply() {
    if (!result) return;

    const acceptedSteps = result.steps.filter((s) => accepted[s.id] === "accepted");

    const newSteps: UserGoalStep[] = acceptedSteps.map((s, i) => ({
      id: s.isNew ? crypto.randomUUID() : s.id,
      label: s.label,
      notes: s.notes,
      idealFinish: s.idealFinish,
      estimatedTime: s.estimatedTime,
      links: s.links ?? [],
      sortOrder: i,
    }));

    onApply(newSteps);
  }

  const acceptedCount = Object.values(accepted).filter(
    (v) => v === "accepted",
  ).length;

  function handleStartImprove() {
    setPhase("loading");
    setError(null);
    setResult(null);
    setAccepted({});
    setLimitMessage(null);
    setLimitTier(null);
    void load();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Improve with AI</h2>
              <p className="text-xs text-muted-foreground">
                {goal.emoji} {goal.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {phase === "prompt" && (
            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                <p className="text-sm leading-relaxed text-violet-200">
                  Tell AI exactly what you want improved so the suggestions stay focused.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">What should be improved?</div>
                <Textarea
                  value={improveRequest}
                  onChange={(event) => setImproveRequest(event.target.value)}
                  placeholder="Examples: make the steps more realistic for my schedule, improve only the skincare product recommendations, tighten the deadlines, break broad steps into smaller actions..."
                  rows={6}
                  className="resize-none text-sm"
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  You can ask for better deadlines, clearer steps, stronger notes,
                  product/resource recommendations, or just one part of the plan.
                </p>
              </div>
            </div>
          )}

          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="flex gap-1.5">
                {["bg-violet-400", "bg-fuchsia-400", "bg-pink-400"].map((c, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 animate-bounce rounded-full ${c}`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Analysing your goal and building improvements…
              </p>
            </div>
          )}

          {phase === "limit" && (
            <div className="px-6 py-20">
              <AIUsageLimitNotice
                tier={limitTier ?? undefined}
                feature="AI goal optimization"
                message={limitMessage ?? undefined}
                secondaryActionLabel="Back"
                onSecondaryAction={onClose}
              />
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="font-medium">Couldn&apos;t generate improvements</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" onClick={reload} className="gap-2">
                <RotateCcw className="h-3.5 w-3.5" />
                Try again
              </Button>
            </div>
          )}

          {phase === "review" && result && (
            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                <p className="text-sm leading-relaxed text-violet-300">{result.summary}</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {acceptedCount} of {result.steps.length} steps selected
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Accept all
                  </button>
                  <span className="text-muted-foreground/40">·</span>
                  <button
                    type="button"
                    onClick={rejectAll}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Reject all
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {result.steps.map((step) => (
                  <StepDiffRow
                    key={step.id}
                    step={step}
                    originalStep={originalById[step.id] ?? null}
                    status={accepted[step.id] ?? "accepted"}
                    onToggle={() => toggleStep(step.id)}
                  />
                ))}
              </div>

              {acceptedCount === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  Select at least one step to apply.
                </p>
              )}
            </div>
          )}
        </div>

        {phase === "prompt" && (
          <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
            <AIUsageInlineHint
              actionLabel="Generating improvements uses 1 AI prompt"
              className="max-w-fit"
            />

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!improveRequest.trim()}
                onClick={handleStartImprove}
                className="gap-1.5"
              >
                Generate suggestions
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {phase === "review" && (
          <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPhase("prompt")}
                className="gap-1.5 text-xs"
              >
                Change request
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={reload}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3 w-3" />
                Regenerate
              </Button>
              <AIUsageInlineHint
                actionLabel="Regenerating uses 1 AI prompt"
                className="max-w-fit"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={acceptedCount === 0}
                onClick={handleApply}
                className="gap-1.5"
              >
                Apply {acceptedCount} step{acceptedCount !== 1 ? "s" : ""}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
